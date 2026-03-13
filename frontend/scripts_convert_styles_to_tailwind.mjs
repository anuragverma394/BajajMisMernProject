import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default;
const generate = generateModule.default;

const ROOT = path.resolve('BajajMisMernProject/frontend/src');
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

const unitless = new Set([
  'opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink',
  'order', 'zoom', 'scale', 'gridRow', 'gridColumn'
]);

function walk(dir, out = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(item.name))) out.push(full);
  }
  return out;
}

function kebab(key) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function encodeVal(v) {
  return String(v)
    .replace(/\s+/g, '_')
    .replace(/"/g, "'")
    .replace(/\[/g, '(')
    .replace(/\]/g, ')');
}

function valueToString(node, keyName) {
  if (!node) return null;
  if (t.isStringLiteral(node)) return node.value;
  if (t.isNumericLiteral(node)) return unitless.has(keyName) ? String(node.value) : `${node.value}px`;
  if (t.isBooleanLiteral(node)) return node.value ? 'true' : 'false';
  if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked || '').join('');
  }
  if (t.isUnaryExpression(node) && node.operator === '-' && t.isNumericLiteral(node.argument)) {
    return unitless.has(keyName) ? `-${node.argument.value}` : `-${node.argument.value}px`;
  }
  return null;
}

function styleObjToClass(node) {
  if (!t.isObjectExpression(node)) return null;
  const out = [];
  for (const p of node.properties) {
    if (!t.isObjectProperty(p) || p.computed) return null;
    let keyName = null;
    if (t.isIdentifier(p.key)) keyName = p.key.name;
    else if (t.isStringLiteral(p.key)) keyName = p.key.value;
    else return null;
    const raw = valueToString(p.value, keyName);
    if (raw == null) return null;
    out.push(`[${kebab(keyName)}:${encodeVal(raw)}]`);
  }
  return out.join(' ');
}

function jsxAttrValueToExpr(attr) {
  if (!attr || !attr.value) return t.stringLiteral('');
  if (t.isStringLiteral(attr.value)) return t.stringLiteral(attr.value.value);
  if (t.isJSXExpressionContainer(attr.value)) return attr.value.expression;
  return t.stringLiteral('');
}

function getAttr(openingEl, name) {
  return openingEl.attributes.find((a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name }));
}

function setClassName(openingEl, classExpr, needsCx) {
  let classAttr = getAttr(openingEl, 'className');
  if (!classAttr) {
    classAttr = t.jsxAttribute(t.jsxIdentifier('className'), null);
    openingEl.attributes.push(classAttr);
  }

  if (!classAttr.value) {
    if (t.isStringLiteral(classExpr)) classAttr.value = t.stringLiteral(classExpr.value);
    else classAttr.value = t.jsxExpressionContainer(classExpr);
    return needsCx;
  }

  const existingExpr = jsxAttrValueToExpr(classAttr);
  const mergedExpr = t.callExpression(t.identifier('__cx'), [existingExpr, classExpr]);
  classAttr.value = t.jsxExpressionContainer(mergedExpr);
  return true;
}

function ensureHelper(program, helperName, helperAst) {
  const exists = program.body.some((n) => t.isVariableDeclaration(n) && n.declarations.some((d) => t.isIdentifier(d.id, { name: helperName })));
  if (exists) return;
  let insertAt = 0;
  for (let i = 0; i < program.body.length; i += 1) {
    if (t.isImportDeclaration(program.body[i])) insertAt = i + 1;
  }
  program.body.splice(insertAt, 0, helperAst);
}

function transformFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(src, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator']
    });
  } catch {
    return false;
  }

  let changed = false;
  let needCx = false;
  let needStyleToTw = false;

  // Convert safe static *Style objects to class strings.
  traverse(ast, {
    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id) || !path.node.id.name.endsWith('Style')) return;
      if (!t.isObjectExpression(path.node.init)) return;
      const cls = styleObjToClass(path.node.init);
      if (!cls) return;

      const binding = path.scope.getBinding(path.node.id.name);
      if (!binding) return;
      const safe = binding.referencePaths.every((rp) => {
        const p1 = rp.parentPath;
        const p2 = p1?.parentPath;
        return p1?.isJSXExpressionContainer() && p2?.isJSXAttribute() && t.isJSXIdentifier(p2.node.name, { name: 'style' });
      });
      if (!safe) return;

      path.node.init = t.stringLiteral(cls);
      changed = true;
    }
  });

  traverse(ast, {
    JSXOpeningElement(path) {
      const styleAttr = getAttr(path.node, 'style');
      if (!styleAttr || !styleAttr.value || !t.isJSXExpressionContainer(styleAttr.value)) return;

      const expr = styleAttr.value.expression;
      let classExpr;

      if (t.isObjectExpression(expr)) {
        const cls = styleObjToClass(expr);
        if (cls != null) classExpr = t.stringLiteral(cls);
      }

      if (!classExpr && t.isIdentifier(expr)) {
        const b = path.scope.getBinding(expr.name);
        if (b && t.isVariableDeclarator(b.path.node) && t.isStringLiteral(b.path.node.init)) {
          classExpr = t.identifier(expr.name);
        }
      }

      if (!classExpr) {
        classExpr = t.callExpression(t.identifier('__styleToTw'), [expr]);
        needStyleToTw = true;
      }

      needCx = setClassName(path.node, classExpr, needCx);
      path.node.attributes = path.node.attributes.filter((a) => a !== styleAttr);
      changed = true;
    }
  });

  if (!changed) return false;

  if (needCx) {
    ensureHelper(ast.program, '__cx', t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('__cx'),
        t.arrowFunctionExpression(
          [t.restElement(t.identifier('vals'))],
          t.callExpression(
            t.memberExpression(
              t.callExpression(
                t.memberExpression(t.identifier('vals'), t.identifier('filter')),
                [t.identifier('Boolean')]
              ),
              t.identifier('join')
            ),
            [t.stringLiteral(' ')]
          )
        )
      )
    ]));
  }

  if (needStyleToTw) {
    const helperCode = `const __styleToTw = (styleObj) => {
  if (!styleObj || typeof styleObj !== 'object') return '';
  const unitlessSet = new Set(['opacity','zIndex','fontWeight','lineHeight','flex','flexGrow','flexShrink','order','zoom','scale','gridRow','gridColumn']);
  return Object.entries(styleObj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '')
    .map(([k, v]) => {
      const cssKey = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      const rawVal = typeof v === 'number' && !unitlessSet.has(k) ? v + 'px' : String(v);
      const safeVal = rawVal.replace(/\\s+/g, '_').replace(/"/g, "'").replace(/\\[/g, '(').replace(/\\]/g, ')');
      return '[' + cssKey + ':' + safeVal + ']';
    })
    .join(' ');
};`;
    const helperAst = parse(helperCode, { sourceType: 'module' }).program.body[0];
    ensureHelper(ast.program, '__styleToTw', helperAst);
  }

  const out = generate(ast, { retainLines: true }, src).code;
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    return true;
  }
  return false;
}

const files = walk(ROOT);
let count = 0;
for (const f of files) {
  if (transformFile(f)) count += 1;
}
console.log(`UPDATED_FILES=${count}`);
