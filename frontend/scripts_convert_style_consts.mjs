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

const unitless = new Set(['opacity','zIndex','fontWeight','lineHeight','flex','flexGrow','flexShrink','order','zoom','scale','gridRow','gridColumn']);
const kebab = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const enc = (v) => String(v).replace(/\s+/g,'_').replace(/"/g,"'").replace(/\[/g,'(').replace(/\]/g,')');

function walk(dir, out = []) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, d.name);
    if (d.isDirectory()) walk(f, out);
    else if (EXT.has(path.extname(d.name))) out.push(f);
  }
  return out;
}

function valToStr(v, key) {
  if (t.isStringLiteral(v)) return v.value;
  if (t.isNumericLiteral(v)) return unitless.has(key) ? String(v.value) : `${v.value}px`;
  if (t.isBooleanLiteral(v)) return v.value ? 'true' : 'false';
  if (t.isUnaryExpression(v) && v.operator === '-' && t.isNumericLiteral(v.argument)) return unitless.has(key) ? `-${v.argument.value}` : `-${v.argument.value}px`;
  if (t.isTemplateLiteral(v) && v.expressions.length === 0) return v.quasis.map((q) => q.value.cooked || '').join('');
  return null;
}

function objToClass(obj) {
  if (!t.isObjectExpression(obj)) return null;
  const arr = [];
  for (const p of obj.properties) {
    if (!t.isObjectProperty(p) || p.computed) return null;
    let key;
    if (t.isIdentifier(p.key)) key = p.key.name;
    else if (t.isStringLiteral(p.key)) key = p.key.value;
    else return null;
    const val = valToStr(p.value, key);
    if (val == null) return null;
    arr.push(`[${kebab(key)}:${enc(val)}]`);
  }
  return arr.join(' ');
}

function ensureCx(program) {
  const has = program.body.some((n) => t.isVariableDeclaration(n) && n.declarations.some((d) => t.isIdentifier(d.id, { name: '__cx' })));
  if (has) return;
  let insertAt = 0;
  for (let i = 0; i < program.body.length; i++) if (t.isImportDeclaration(program.body[i])) insertAt = i + 1;
  program.body.splice(insertAt, 0, t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier('__cx'),
      t.arrowFunctionExpression([t.restElement(t.identifier('vals'))],
        t.callExpression(t.memberExpression(t.callExpression(t.memberExpression(t.identifier('vals'), t.identifier('filter')), [t.identifier('Boolean')]), t.identifier('join')), [t.stringLiteral(' ')])
      )
    )
  ]));
}

function transform(file) {
  const src = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx','typescript','objectRestSpread','optionalChaining','nullishCoalescingOperator'] });
  } catch {
    return false;
  }
  let changed = false;
  let needCx = false;
  const converted = new Set();

  traverse(ast, {
    VariableDeclarator(p) {
      if (!t.isIdentifier(p.node.id) || !p.node.id.name.endsWith('Style')) return;
      if (!t.isObjectExpression(p.node.init)) return;
      const cls = objToClass(p.node.init);
      if (!cls) return;
      p.node.init = t.stringLiteral(cls);
      converted.add(p.node.id.name);
      changed = true;
    }
  });

  if (converted.size) {
    traverse(ast, {
      CallExpression(p) {
        if (!t.isIdentifier(p.node.callee, { name: '__styleToTw' })) return;
        const arg = p.node.arguments[0];
        if (!arg) return;

        if (t.isIdentifier(arg) && converted.has(arg.name)) {
          p.replaceWith(t.identifier(arg.name));
          changed = true;
          return;
        }

        if (t.isObjectExpression(arg) && arg.properties.length) {
          const first = arg.properties[0];
          if (t.isSpreadElement(first) && t.isIdentifier(first.argument) && converted.has(first.argument.name)) {
            const base = first.argument;
            const restObj = t.objectExpression(arg.properties.slice(1));
            let restExpr = null;
            if (restObj.properties.length === 0) {
              p.replaceWith(base);
              changed = true;
              return;
            }
            const restCls = objToClass(restObj);
            if (restCls != null) restExpr = t.stringLiteral(restCls);
            else restExpr = t.callExpression(t.identifier('__styleToTw'), [restObj]);
            p.replaceWith(t.callExpression(t.identifier('__cx'), [base, restExpr]));
            needCx = true;
            changed = true;
          }
        }
      }
    });
  }

  if (!changed) return false;
  if (needCx) ensureCx(ast.program);
  const out = generate(ast, { retainLines: true }, src).code;
  fs.writeFileSync(file, out, 'utf8');
  return true;
}

let count = 0;
for (const f of walk(ROOT)) if (transform(f)) count++;
console.log(`UPDATED_SECOND_PASS=${count}`);
