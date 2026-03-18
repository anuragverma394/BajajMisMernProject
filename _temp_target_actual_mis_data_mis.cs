public JsonResult TargetActualMISDataMis(string F_Name, string CP_Date)
        {
            List<TargetActualMISReport> MainList = new List<TargetActualMISReport>();
            try
            {
                DataTable dt1 = new DataTable();
                dt1.Columns.AddRange(new DataColumn[57] {
                            new DataColumn("FACTORY", typeof(string)),
                            new DataColumn("CPSYRUP", typeof(string)),
                            new DataColumn("CPBHY", typeof(string)),
                            new DataColumn("CPFM", typeof(string)),
                            new DataColumn("CPTOTAL", typeof(string)),
                            new DataColumn("ACH_SYRUP",typeof(string)),
                            new DataColumn("ACH_BHY",typeof(string)),
                            new DataColumn("ACH_FM",typeof(string)),
                            new DataColumn("ACHTOTAL", typeof(string)),
                            new DataColumn("BL_ACH_SYRUP",typeof(string)),
                            new DataColumn("BL_ACH_BHY",typeof(string)),
                            new DataColumn("BL_ACH_FM",typeof(string)),
                            new DataColumn("BLTOTAL", typeof(string)),
                            new DataColumn("POL_PERC_TARGET",typeof(string)),
                            new DataColumn("POL_PERC_ONDATE",typeof(string)),
                            new DataColumn("POL_PERC_TODATE",typeof(string)),
                            new DataColumn("REC_PERC_TARGET",typeof(string)),
                            new DataColumn("REC_PERC_ONDATE",typeof(string)),
                            new DataColumn("REC_PERC_TODATE",typeof(string)),
                            new DataColumn("SG_PROD_ONDATE",typeof(string)),
                            new DataColumn("SG_PROD_TODATE",typeof(string)),
                            new DataColumn("BH_PERC_TARGET",typeof(string)),
                            new DataColumn("BH_PERC_ONDATE",typeof(string)),
                            new DataColumn("BH_PERC_TODATE",typeof(string)),
                             new DataColumn("BH_QTY_ONDATE",typeof(string)),
                            new DataColumn("BH_QTY_TODATE",typeof(string)),

                            new DataColumn("CH_PERC_TARGET",typeof(string)),
                            new DataColumn("CH_PERC_ONDATE",typeof(string)),
                            new DataColumn("CH_PERC_TODATE",typeof(string)),
                            new DataColumn("CH_QTY_ONDATE",typeof(string)),
                            new DataColumn("CH_QTY_TODATE",typeof(string)),

                            new DataColumn("MOL_PERC_BHY_TARGET",typeof(string)),
                            new DataColumn("MOL_PERC_BHY_ONDATE",typeof(string)),
                            new DataColumn("MOL_PERC_BHY_TODATE",typeof(string)),
                            new DataColumn("MOL_PERC_CHY_TARGET",typeof(string)),
                            new DataColumn("MOL_PERC_CHY_ONDATE",typeof(string)),
                            new DataColumn("MOL_PERC_CHY_TODATE",typeof(string)),
                            new DataColumn("MOL_PERC_BCHY_TARGET",typeof(string)),
                            new DataColumn("MOL_PERC_BCHY_ONDATE",typeof(string)),
                            new DataColumn("MOL_PERC_BCHY_TODATE",typeof(string)),
                            new DataColumn("STCANE_PERC_TARGET",typeof(string)),
                            new DataColumn("STCANE_PERC_ONDATE",typeof(string)),
                            new DataColumn("STCANE_PERC_TODATE",typeof(string)),
                            new DataColumn("BAGASE_PERC_TARGET",typeof(string)),
                            new DataColumn("BAGASE_PERC_ONDATE",typeof(string)),
                            new DataColumn("BAGASE_PERC_TODATE",typeof(string)),
                            new DataColumn("BAGASE_QTY_ONDATE",typeof(string)),
                            new DataColumn("BAGASE_QTY_TODATE",typeof(string)),

                            new DataColumn("ALHL_TOTAL_TARGET",typeof(string)),
                            new DataColumn("ALHL_TOTAL_ONDATE",typeof(string)),
                            new DataColumn("ALHL_TOTAL_TODATE",typeof(string)),

                            new DataColumn("POWER_PRODUCED_TARGET",typeof(string)),
                            new DataColumn("POWER_PRODUCED_ONDATE",typeof(string)),
                            new DataColumn("POWER_PRODUCED_TODATE",typeof(string)),
                            new DataColumn("POWER_EXPORT_TARGET",typeof(string)),
                            new DataColumn("POWER_EXPORT_ONDATE",typeof(string)),
                            new DataColumn("POWER_EXPORT_TODATE",typeof(string)),
                        });

                string date = "";
                string dates = "";

                decimal OndateCrush = 0;
                decimal TodateCrush = 0;
                //pol
                decimal WZPolOnDatePerTotal = 0;
                decimal WZPolOnDateCrush = 0;
                decimal WZPolOnDatePerc = 0;
                decimal CZPolOnDatePerTotal = 0;
                decimal CZPolOnDateCrush = 0;
                decimal CZPolOnDatePerc = 0;
                decimal EZPolOnDatePerTotal = 0;
                decimal EZPolOnDateCrush = 0;
                decimal EZPolOnDatePerc = 0;
                decimal BHSLPolOnDatePerTotal = 0;
                decimal BHSLPolOnDateCrush = 0;
                decimal BHSLPolOnDatePerc = 0;

                decimal WZPolToDatePerTotal = 0;
                decimal WZPolToDateCrush = 0;
                decimal WZPolToDatePerc = 0;
                decimal CZPolToDatePerTotal = 0;
                decimal CZPolToDateCrush = 0;
                decimal CZPolToDatePerc = 0;
                decimal EZPolToDatePerTotal = 0;
                decimal EZPolToDateCrush = 0;
                decimal EZPolToDatePerc = 0;
                decimal BHSLPolToDatePerTotal = 0;
                decimal BHSLPolToDateCrush = 0;
                decimal BHSLPolToDatePerc = 0;

                //stcate
                decimal WZSTOnDatePerTotal = 0;
                decimal WZSTOnDateCrush = 0;
                decimal WZSTOnDatePerc = 0;
                decimal CZSTOnDatePerTotal = 0;
                decimal CZSTOnDateCrush = 0;
                decimal CZSTOnDatePerc = 0;
                decimal EZSTOnDatePerTotal = 0;
                decimal EZSTOnDateCrush = 0;
                decimal EZSTOnDatePerc = 0;
                decimal BHSLSTOnDatePerTotal = 0;
                decimal BHSLSTOnDateCrush = 0;
                decimal BHSLSTOnDatePerc = 0;

                decimal WZSTToDatePerTotal = 0;
                decimal WZSTToDateCrush = 0;
                decimal WZSTToDatePerc = 0;
                decimal CZSTToDatePerTotal = 0;
                decimal CZSTToDateCrush = 0;
                decimal CZSTToDatePerc = 0;
                decimal EZSTToDatePerTotal = 0;
                decimal EZSTToDateCrush = 0;
                decimal EZSTToDatePerc = 0;
                decimal BHSLSTToDatePerTotal = 0;
                decimal BHSLSTToDateCrush = 0;
                decimal BHSLSTToDatePerc = 0;

                //Bagasse
                decimal WZBGOnDatePerTotal = 0;
                decimal WZBGOnDateCrush = 0;
                decimal WZBGOnDatePerc = 0;
                decimal CZBGOnDatePerTotal = 0;
                decimal CZBGOnDateCrush = 0;
                decimal CZBGOnDatePerc = 0;
                decimal EZBGOnDatePerTotal = 0;
                decimal EZBGOnDateCrush = 0;
                decimal EZBGOnDatePerc = 0;
                decimal BHSLBGOnDatePerTotal = 0;
                decimal BHSLBGOnDateCrush = 0;
                decimal BHSLBGOnDatePerc = 0;

                decimal WZBGToDatePerTotal = 0;
                decimal WZBGToDateCrush = 0;
                decimal WZBGToDatePerc = 0;
                decimal CZBGToDatePerTotal = 0;
                decimal CZBGToDateCrush = 0;
                decimal CZBGToDatePerc = 0;
                decimal EZBGToDatePerTotal = 0;
                decimal EZBGToDateCrush = 0;
                decimal EZBGToDatePerc = 0;
                decimal BHSLBGToDatePerTotal = 0;
                decimal BHSLBGToDateCrush = 0;
                decimal BHSLBGToDatePerc = 0;

                decimal WZptcrondate = 0;
                decimal WZptcrrctotal = 0;
                decimal WZprcpreondate = 0;
                decimal CZptcrondate = 0;
                decimal CZptcrrctotal = 0;
                decimal CZprcpreondate = 0;
                decimal EZptcrondate = 0;
                decimal EZptcrrctotal = 0;
                decimal EZprcpreondate = 0;
                decimal BHSLptcrondate = 0;
                decimal BHSLptcrrctotal = 0;
                decimal BHSLprcpreondate = 0;

                decimal WZCCToDate = 0;
                decimal WZRecCanceToDate = 0;
                decimal WZRecPercToDate = 0;
                decimal CZCCToDate = 0;
                decimal CZRecCanceToDate = 0;
                decimal CZRecPercToDate = 0;
                decimal EZCCToDate = 0;
                decimal EZRecCanceToDate = 0;
                decimal EZRecPercToDate = 0;
                decimal BHSLptcrTodate = 0;
                decimal BHSLptcrrcTodatetotal = 0;
                decimal BHSLprcpreTodate = 0;

                //Bh%
                decimal WZBHOnDatePerTotal = 0;
                decimal WZBHOnDateCrush = 0;
                decimal WZBHOnDatePerc = 0;
                decimal CZBHOnDatePerTotal = 0;
                decimal CZBHOnDateCrush = 0;
                decimal CZBHOnDatePerc = 0;
                decimal EZBHOnDatePerTotal = 0;
                decimal EZBHOnDateCrush = 0;
                decimal EZBHOnDatePerc = 0;
                decimal BHSLBHOnDatePerTotal = 0;
                decimal BHSLBHOnDateCrush = 0;
                decimal BHSLBHOnDatePerc = 0;

                decimal WZBHToDatePerTotal = 0;
                decimal WZBHToDateCrush = 0;
                decimal WZBHToDatePerc = 0;
                decimal CZBHToDatePerTotal = 0;
                decimal CZBHToDateCrush = 0;
                decimal CZBHToDatePerc = 0;
                decimal EZBHToDatePerTotal = 0;
                decimal EZBHToDateCrush = 0;
                decimal EZBHToDatePerc = 0;
                decimal BHSLBHToDatePerTotal = 0;
                decimal BHSLBHToDateCrush = 0;
                decimal BHSLBHToDatePerc = 0;
                //Ch%
                decimal WZCHOnDatePerTotal = 0;
                decimal WZCHOnDateCrush = 0;
                decimal WZCHOnDatePerc = 0;
                decimal CZCHOnDatePerTotal = 0;
                decimal CZCHOnDateCrush = 0;
                decimal CZCHOnDatePerc = 0;
                decimal EZCHOnDatePerTotal = 0;
                decimal EZCHOnDateCrush = 0;
                decimal EZCHOnDatePerc = 0;
                decimal BHSLCHOnDatePerTotal = 0;
                decimal BHSLCHOnDateCrush = 0;
                decimal BHSLCHOnDatePerc = 0;

                decimal WZCHToDatePerTotal = 0;
                decimal WZCHToDateCrush = 0;
                decimal WZCHToDatePerc = 0;
                decimal CZCHToDatePerTotal = 0;
                decimal CZCHToDateCrush = 0;
                decimal CZCHToDatePerc = 0;
                decimal EZCHToDatePerTotal = 0;
                decimal EZCHToDateCrush = 0;
                decimal EZCHToDatePerc = 0;
                decimal BHSLCHToDatePerTotal = 0;
                decimal BHSLCHToDateCrush = 0;
                decimal BHSLCHToDatePerc = 0;

                //LBhy%
                decimal WZLMBHOnDatePerTotal = 0;
                decimal WZLMBHOnDateCrush = 0;
                decimal WZLMBHOnDatePerc = 0;
                decimal CZLMBHOnDatePerTotal = 0;
                decimal CZLMBHOnDateCrush = 0;
                decimal CZLMBHOnDatePerc = 0;
                decimal EZLMBHOnDatePerTotal = 0;
                decimal EZLMBHOnDateCrush = 0;
                decimal EZLMBHOnDatePerc = 0;
                decimal BHSLLMBHOnDatePerTotal = 0;
                decimal BHSLLMBHOnDateCrush = 0;
                decimal BHSLLMBHOnDatePerc = 0;

                decimal WZLMBHToDatePerTotal = 0;
                decimal WZLMBHToDateCrush = 0;
                decimal WZLMBHToDatePerc = 0;
                decimal CZLMBHToDatePerTotal = 0;
                decimal CZLMBHToDateCrush = 0;
                decimal CZLMBHToDatePerc = 0;
                decimal EZLMBHToDatePerTotal = 0;
                decimal EZLMBHToDateCrush = 0;
                decimal EZLMBHToDatePerc = 0;
                decimal BHSLLMBHToDatePerTotal = 0;
                decimal BHSLLMBHToDateCrush = 0;
                decimal BHSLLMBHToDatePerc = 0;

                //LChy%
                decimal WZLMCHOnDatePerTotal = 0;
                decimal WZLMCHOnDateCrush = 0;
                decimal WZLMCHOnDatePerc = 0;
                decimal CZLMCHOnDatePerTotal = 0;
                decimal CZLMCHOnDateCrush = 0;
                decimal CZLMCHOnDatePerc = 0;
                decimal EZLMCHOnDatePerTotal = 0;
                decimal EZLMCHOnDateCrush = 0;
                decimal EZLMCHOnDatePerc = 0;
                decimal BHSLLMCHOnDatePerTotal = 0;
                decimal BHSLLMCHOnDateCrush = 0;
                decimal BHSLLMCHOnDatePerc = 0;

                decimal WZLMCHToDatePerTotal = 0;
                decimal WZLMCHToDateCrush = 0;
                decimal WZLMCHToDatePerc = 0;
                decimal CZLMCHToDatePerTotal = 0;
                decimal CZLMCHToDateCrush = 0;
                decimal CZLMCHToDatePerc = 0;
                decimal EZLMCHToDatePerTotal = 0;
                decimal EZLMCHToDateCrush = 0;
                decimal EZLMCHToDatePerc = 0;
                decimal BHSLLMCHToDatePerTotal = 0;
                decimal BHSLLMCHToDateCrush = 0;
                decimal BHSLLMCHToDatePerc = 0;

                //LbChy%
                decimal WZLMBCHOnDatePerTotal = 0;
                decimal WZLMBCHOnDateCrush = 0;
                decimal WZLMBCHOnDatePerc = 0;
                decimal CZLMBCHOnDatePerTotal = 0;
                decimal CZLMBCHOnDateCrush = 0;
                decimal CZLMBCHOnDatePerc = 0;
                decimal EZLMBCHOnDatePerTotal = 0;
                decimal EZLMBCHOnDateCrush = 0;
                decimal EZLMBCHOnDatePerc = 0;
                decimal BHSLLMBCHOnDatePerTotal = 0;
                decimal BHSLLMBCHOnDateCrush = 0;
                decimal BHSLLMBCHOnDatePerc = 0;

                decimal WZLMBCHToDatePerTotal = 0;
                decimal WZLMBCHToDateCrush = 0;
                decimal WZLMBCHToDatePerc = 0;
                decimal CZLMBCHToDatePerTotal = 0;
                decimal CZLMBCHToDateCrush = 0;
                decimal CZLMBCHToDatePerc = 0;
                decimal EZLMBCHToDatePerTotal = 0;
                decimal EZLMBCHToDateCrush = 0;
                decimal EZLMBCHToDatePerc = 0;
                decimal BHSLLMBCHToDatePerTotal = 0;
                decimal BHSLLMBCHToDateCrush = 0;
                decimal BHSLLMBCHToDatePerc = 0;

                if (CP_Date.Length > 0)
                {
                    date = CP_Date.Trim();
                    DateTime cdate = DateTime.ParseExact(CP_Date, "dd/MM/yyyy", CultureInfo.InvariantCulture);
                    dates = DateTime.ParseExact(CP_Date, "dd/MM/yyyy", CultureInfo.InvariantCulture).ToString("yyyy-MM-dd");
                }
                string f_code = "";
                if (Session["WUTID"].ToString() != "1")
                {
                    if (F_Name != "0")
                    {
                        f_code = F_Name;
                    }
                }
                else if (F_Name != "0")
                {
                    f_code = F_Name;
                }
                DataTable dt = OBJTARGET.GETTargetDataByFactID(f_code);
                DataTable dtsg = new DataTable();
                if (dt != null && dt.Rows.Count > 0)
                {
                    DataRow dr1 = dt1.NewRow();
                    for (int a = 0; a < dt.Rows.Count; a++)
                    {
                        dr1 = dt1.NewRow();
                        dr1["FACTORY"] = dt.Rows[a]["F_Short"].ToString();
                        dr1["CPSYRUP"] = dt.Rows[a]["CP_Syrup"].ToString();
                        dr1["CPBHY"] = dt.Rows[a]["CP_BHY"].ToString();
                        dr1["CPFM"] = dt.Rows[a]["CP_FM"].ToString();
                        dr1["CPTOTAL"] = dt.Rows[a]["CP_Total"].ToString();
                        dr1["POL_PERC_TARGET"] = dt.Rows[a]["CP_PolPTarget"].ToString();
                        dr1["REC_PERC_TARGET"] = dt.Rows[a]["CP_RecPTarget"].ToString();
                        dr1["BH_PERC_TARGET"] = dt.Rows[a]["CP_BHPTarget"].ToString();
                        dr1["CH_PERC_TARGET"] = dt.Rows[a]["CP_CHPTarget"].ToString();
                        dr1["MOL_PERC_BHY_TARGET"] = dt.Rows[a]["CP_LossMolBHYPTarget"].ToString();
                        dr1["MOL_PERC_CHY_TARGET"] = dt.Rows[a]["CP_LossMolCHYPTarget"].ToString();
                        dr1["MOL_PERC_BCHY_TARGET"] = dt.Rows[a]["CP_LossMolBHYCHYPTarget"].ToString();
                        dr1["STCANE_PERC_TARGET"] = dt.Rows[a]["CP_SteamPTarget"].ToString();
                        dr1["BAGASE_PERC_TARGET"] = dt.Rows[a]["CCP_BagassPTarget"].ToString();
                        dr1["ALHL_TOTAL_TARGET"] = (Convert.ToDecimal(dt.Rows[a]["CP_Alcohol_Syrup"].ToString()) + Convert.ToDecimal(dt.Rows[a]["CP_Alcohol_BH"].ToString()) + Convert.ToDecimal(dt.Rows[a]["CP_Alcohol_CH"].ToString()));
                        dr1["POWER_PRODUCED_TARGET"] = dt.Rows[a]["CP_PPTarget"].ToString();
                        dr1["POWER_EXPORT_TARGET"] = dt.Rows[a]["CP_PETarget"].ToString();

                        DataTable dtact = obj1.GEActualData(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (dtact != null && dtact.Rows.Count > 0)
                        {
                            decimal ACH_SYRUP = 0;
                            decimal BL_ACH_SYRUP = 0;
                            decimal ACH_BHY = 0;
                            decimal BL_ACH_BHY = 0;
                            decimal ACH_FM = 0;
                            decimal BL_ACH_FM = 0;
                            int g = 0;
                            for (int i = 0; i < dtact.Rows.Count; i++)
                            {

                                if (dtact.Rows[i]["Cn_Rec_ThisProdtype"].ToString() == "3")
                                {
                                    ACH_SYRUP = Convert.ToDecimal(dtact.Rows[i]["TCrush"].ToString());

                                    BL_ACH_SYRUP = Convert.ToDecimal(dt.Rows[a]["CP_Syrup"].ToString()) - Convert.ToDecimal(dtact.Rows[i]["TCrush"].ToString());
                                }
                                else
                                {
                                    ACH_SYRUP += 0;
                                    if (BL_ACH_SYRUP > 0)
                                    {
                                        BL_ACH_SYRUP += 0;
                                    }
                                    else
                                    {
                                        BL_ACH_SYRUP += Convert.ToDecimal(dt.Rows[a]["CP_Syrup"].ToString());
                                    }

                                }
                                if (dtact.Rows[i]["Cn_Rec_ThisProdtype"].ToString() == "1")
                                {

                                    ACH_BHY = Convert.ToDecimal(dtact.Rows[i]["TCrush"].ToString());

                                    BL_ACH_BHY = Convert.ToDecimal(dt.Rows[a]["CP_BHY"].ToString()) - Convert.ToDecimal(dtact.Rows[i]["TCrush"].ToString());
                                }
                                else
                                {
                                    ACH_BHY += 0;
                                    if (BL_ACH_BHY > 0)
                                    {
                                        BL_ACH_BHY += 0;
                                    }
                                    else
                                    {
                                        BL_ACH_BHY += Convert.ToDecimal(dt.Rows[a]["CP_BHY"].ToString());
                                    }

                                }

                                if (dtact.Rows[i]["Cn_Rec_ThisProdtype"].ToString() == "2")
                                {

                                    ACH_FM = Convert.ToDecimal(dtact.Rows[i]["TCrush"].ToString());
                                    BL_ACH_FM = Convert.ToDecimal(dt.Rows[a]["CP_FM"].ToString()) - Convert.ToDecimal(dtact.Rows[i]["TCrush"].ToString());
                                }
                                else
                                {
                                    ACH_FM += 0;
                                    if (BL_ACH_FM > 0)
                                    {
                                        BL_ACH_FM += 0;
                                    }
                                    else
                                    {
                                        BL_ACH_FM += Convert.ToDecimal(dt.Rows[a]["CP_FM"].ToString());
                                    }

                                }
                            }
                            dr1["ACH_SYRUP"] = ACH_SYRUP.ToString();
                            dr1["ACH_BHY"] = ACH_BHY.ToString();
                            dr1["ACH_FM"] = ACH_FM.ToString();



                            dr1["BL_ACH_SYRUP"] = BL_ACH_SYRUP.ToString();
                            dr1["BL_ACH_BHY"] = BL_ACH_BHY.ToString();
                            dr1["BL_ACH_FM"] = BL_ACH_FM.ToString();

                            dr1["ACHTOTAL"] = (ACH_SYRUP + ACH_BHY + ACH_FM).ToString();
                            dr1["BLTOTAL"] = (BL_ACH_SYRUP + BL_ACH_BHY + BL_ACH_FM).ToString();

                        }
                        else
                        {
                            dr1["ACH_SYRUP"] = "0";
                            dr1["ACH_BHY"] = "0";
                            dr1["ACH_FM"] = "0";
                            dr1["ACHTOTAL"] = "0";
                            dr1["BL_ACH_SYRUP"] = dt.Rows[a]["CP_Syrup"].ToString();
                            dr1["BL_ACH_BHY"] = dt.Rows[a]["CP_BHY"].ToString();
                            dr1["BL_ACH_FM"] = dt.Rows[a]["CP_FM"].ToString();
                            dr1["BLTOTAL"] = (Convert.ToDecimal(dt.Rows[a]["CP_Syrup"].ToString()) + Convert.ToDecimal(dt.Rows[a]["CP_BHY"].ToString()) + Convert.ToDecimal(dt.Rows[a]["CP_FM"].ToString())).ToString();
                        }

                        dtsg = obj1.GetSapData(dt.Rows[a]["F_Code"].ToString(), date, Session["WUserID"].ToString());
                        if (dtsg != null && dtsg.Rows.Count > 0)
                        {
                            //dr1["SG_PROD_ONDATE"] = dtsg.Rows[0]["Cn_SugBagQtl_OnDate"].ToString();
                            //dr1["SG_PROD_TODATE"] = dtsg.Rows[0]["Cn_SugBagQtl_ToDate"].ToString();
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_POL_Perc_CaneOndate2223"].ToString()) > 0)
                            //{
                            //    dr1["POL_PERC_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_POL_Perc_CaneOndate2223"].ToString());

                            //}
                            //else
                            //{
                            //    dr1["POL_PERC_ONDATE"] = 0;
                            //}


                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_POL_Perc_CaneTodate2223"].ToString()) > 0 )
                            //{
                            //    dr1["POL_PERC_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_POL_Perc_CaneTodate2223"].ToString());
                            //}

                            //else
                            //{
                            //    dr1["POL_PERC_TODATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_Recovery_Perc_Ondate2223"].ToString()) > 0)
                            //{
                            //    dr1["REC_PERC_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_Recovery_Perc_Ondate2223"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["REC_PERC_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_Recovery_Perc_Todate2223"].ToString()) > 0)
                            //{
                            //    dr1["REC_PERC_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_Recovery_Perc_Todate2223"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["REC_PERC_TODATE"] = 0;
                            //}

                            if (dtsg.Rows[0]["Cn_MolassesCategory2223"].ToString() == "1")
                            {
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityOndate2223"].ToString()) > 0)
                                //{
                                //    dr1["BH_PERC_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityOndate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["BH_PERC_ONDATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityTodate2223"].ToString()) > 0)
                                //{
                                //    dr1["BH_PERC_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityTodate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["BH_PERC_TODATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityQtlsOndate2223"].ToString()) > 0)
                                //{
                                //    dr1["BH_QTY_ONDATE"] = dtsg.Rows[0]["Cn_MolPurityQtlsOndate2223"].ToString();
                                //}
                                //else
                                //{
                                //    dr1["BH_QTY_ONDATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityQtlsTodate2223"].ToString()) > 0)
                                //{
                                //    dr1["BH_QTY_TODATE"] = dtsg.Rows[0]["Cn_MolPurityQtlsTodate2223"].ToString();
                                //}
                                //else
                                //{
                                //    dr1["BH_QTY_TODATE"] = 0;
                                //}
                                //alcohol





                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionOndate2223"].ToString()) > 0)
                                //{
                                //    dr1["ALHL_BH_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionOndate2223"].ToString());
                                //    tonalc += Math.Round(Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionOndate2223"].ToString()), 2);
                                //}
                                //else
                                //{
                                //    dr1["ALHL_BH_ONDATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionTodate2223"].ToString()) > 0)
                                //{
                                //    dr1["ALHL_BH_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionTodate2223"].ToString());
                                //    ttdalc += Math.Round(Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionTodate2223"].ToString()), 2);
                                //}
                                //else
                                //{
                                //    dr1["ALHL_BH_TODATE"] =0;
                                //}
                                dr1["CH_PERC_ONDATE"] = 0;
                                dr1["CH_PERC_TODATE"] = 0;
                                dr1["CH_QTY_ONDATE"] = 0;
                                dr1["CH_QTY_TODATE"] = 0;
                                //dr1["ALHL_CH_ONDATE"] = 0;
                                //dr1["ALHL_CH_TODATE"] = 0;
                            }
                            else if (dtsg.Rows[0]["Cn_MolassesCategory2223"].ToString() == "2")
                            {

                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityOndate2223"].ToString()) > 0)
                                //{
                                //    dr1["CH_PERC_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityOndate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["CH_PERC_ONDATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityTodate2223"].ToString()) > 0)
                                //{
                                //    dr1["CH_PERC_TODATE"] = dtsg.Rows[0]["Cn_MolPurityTodate2223"].ToString();
                                //}
                                //else
                                //{
                                //    dr1["CH_PERC_TODATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityQtlsOndate2223"].ToString()) > 0)
                                //{
                                //    dr1["CH_QTY_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityQtlsOndate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["CH_QTY_ONDATE"] = 0;
                                //}
                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityQtlsTodate2223"].ToString()) > 0)
                                //{
                                //    dr1["CH_QTY_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_MolPurityQtlsTodate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["CH_QTY_TODATE"] = 0;
                                //}

                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionOndate2223"].ToString()) > 0)
                                //{
                                //    dr1["ALHL_CH_ONDATE"] =Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionOndate2223"].ToString());
                                //    tonalc += Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionOndate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["ALHL_CH_ONDATE"] = 0;
                                //}

                                //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionTodate2223"].ToString()) > 0)
                                //{
                                //    dr1["ALHL_CH_TODATE"] =Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionTodate2223"].ToString());
                                //    ttdalc += Convert.ToDecimal(dtsg.Rows[0]["Cn_ProductionTodate2223"].ToString());
                                //}
                                //else
                                //{
                                //    dr1["ALHL_CH_TODATE"] = 0;
                                //}
                                dr1["BH_PERC_ONDATE"] = 0;
                                dr1["BH_PERC_TODATE"] = 0;
                                dr1["BH_QTY_ONDATE"] = 0;
                                dr1["BH_QTY_TODATE"] = 0;
                                //dr1["ALHL_BH_TODATE"] = 0;
                                //dr1["ALHL_BH_ONDATE"] = 0;
                            }
                            else
                            {
                                dr1["BH_PERC_ONDATE"] = 0;
                                dr1["BH_PERC_TODATE"] = 0;
                                dr1["BH_QTY_ONDATE"] = 0;
                                dr1["BH_QTY_TODATE"] = 0;
                                dr1["CH_PERC_ONDATE"] = 0;
                                dr1["CH_PERC_TODATE"] = 0;
                                dr1["CH_QTY_ONDATE"] = 0;
                                dr1["CH_QTY_TODATE"] = 0;
                                //dr1["ALHL_BH_ONDATE"] = 0;
                                //dr1["ALHL_BH_TODATE"] = 0;
                                //dr1["ALHL_CH_ONDATE"] = 0;
                                //dr1["ALHL_CH_TODATE"] = 0;
                            }
                            //dr1["ALHL_TOTAL_ONDATE"] = tonalc.ToString();
                            //dr1["ALHL_TOTAL_TODATE"] = ttdalc.ToString();
                            //dr1["ALHL_SYRUP_ONDATE"] = "0";
                            //dr1["ALHL_SYRUP_TODATE"] = "0";

                            //bhy
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInBHyMolPercCaneOnDate"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_BHY_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInBHyMolPercCaneOnDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_BHY_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInBHyMolPercCaneToDate"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_BHY_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInBHyMolPercCaneToDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_BHY_TODATE"] = 0;
                            //}
                            ////chy
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInCHyMolPercCaneOnDate"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_CHY_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInCHyMolPercCaneOnDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_CHY_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInCHyMolPercCaneToDate"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_CHY_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_LossInCHyMolPercCaneToDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_CHY_TODATE"] = 0;
                            //}
                            ////bhy+chy
                            //if (Convert.ToDecimal(dtsg.Rows[0]["lossondate"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_BCHY_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["lossondate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_BCHY_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["losstodate"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_BCHY_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["losstodate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_BCHY_TODATE"] = 0;
                            //}

                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_Loss_Perc_Ondate2223"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_BCHY_ONDATE"] = dtsg.Rows[0]["Cn_Loss_Perc_Ondate2223"].ToString();
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_BCHY_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_Loss_Perc_Todate2223"].ToString()) > 0)
                            //{
                            //    dr1["MOL_PERC_BCHY_TODATE"] = dtsg.Rows[0]["Cn_Loss_Perc_Todate2223"].ToString();
                            //}
                            //else
                            //{
                            //    dr1["MOL_PERC_BCHY_TODATE"] = 0;
                            //}

                            //steam % 
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_Steam_Perc_Ondate2223"].ToString()) > 0)
                            //{
                            //    dr1["STCANE_PERC_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_Steam_Perc_Ondate2223"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["STCANE_PERC_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_Steam_Perc_Todate2223"].ToString()) > 0)
                            //{
                            //    dr1["STCANE_PERC_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_Steam_Perc_Todate2223"].ToString());
                            //}
                            //else

                            //{
                            //    dr1["STCANE_PERC_TODATE"] = 0;
                            //}

                            //Baggase Saving Perc
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_BagasseSavingPercCaneOnDate"].ToString()) > 0 || Convert.ToDecimal(dtsg.Rows[0]["Cn_BagasseSavingPercCaneOnDate"].ToString()) < 0)
                            //{
                            //    dr1["BAGASE_PERC_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_BagasseSavingPercCaneOnDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["BAGASE_PERC_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_BagasseSavingPercCaneToDate"].ToString()) > 0 || Convert.ToDecimal(dtsg.Rows[0]["Cn_BagasseSavingPercCaneToDate"].ToString()) < 0)
                            //{
                            //    dr1["BAGASE_PERC_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_BagasseSavingPercCaneToDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["BAGASE_PERC_TODATE"] = 0;
                            //}

                            //Bagasse Qty
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_BaggaseProdOnDate"].ToString()) > 0 || Convert.ToDecimal(dtsg.Rows[0]["Cn_BaggaseProdOnDate"].ToString()) < 0)
                            //{
                            //    dr1["BAGASE_QTY_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_BaggaseProdOnDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["BAGASE_QTY_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_BaggaseProdToDate"].ToString()) > 0 || Convert.ToDecimal(dtsg.Rows[0]["Cn_BaggaseProdToDate"].ToString()) < 0)
                            //{
                            //    dr1["BAGASE_QTY_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_BaggaseProdToDate"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["BAGASE_QTY_TODATE"] = 0;
                            //}

                            //Power PRODUCED and EXPORT
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerProduced_Kwh_Ondate2223"].ToString()) > 0)
                            //{
                            //    dr1["POWER_PRODUCED_ONDATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerProduced_Kwh_Ondate2223"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["POWER_PRODUCED_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerProduced_Kwh_Todate2223"].ToString()) > 0)
                            //{
                            //    dr1["POWER_PRODUCED_TODATE"] = Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerProduced_Kwh_Todate2223"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["POWER_PRODUCED_TODATE"] = 0;
                            //}

                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerExport_Kwh_Ondate2223"].ToString()) > 0)
                            //{
                            //    dr1["POWER_EXPORT_ONDATE"] = Math.Round(Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerExport_Kwh_Ondate2223"].ToString()), 2);
                            //}
                            //else
                            //{
                            //    dr1["POWER_EXPORT_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerExport_Kwh_Todate2223"].ToString()) > 0)
                            //{
                            //    dr1["POWER_EXPORT_TODATE"] = Math.Round(Convert.ToDecimal(dtsg.Rows[0]["Cn_PowerExport_Kwh_Todate2223"].ToString()), 2);
                            //}
                            //else
                            //{
                            //    dr1["POWER_EXPORT_TODATE"] = 0;
                            //}

                        }
                        else
                        {
                            dr1["SG_PROD_ONDATE"] = "0";
                            dr1["SG_PROD_TODATE"] = "0";

                            dr1["POL_PERC_ONDATE"] = "0";
                            dr1["POL_PERC_TODATE"] = "0";
                            dr1["REC_PERC_ONDATE"] = "0";
                            dr1["REC_PERC_TODATE"] = "0";

                            dr1["BH_PERC_ONDATE"] = 0;
                            dr1["BH_PERC_TODATE"] = 0;

                            dr1["BH_QTY_ONDATE"] = "0";
                            dr1["BH_QTY_TODATE"] = "0";

                            dr1["CH_PERC_ONDATE"] = "0";
                            dr1["CH_PERC_TODATE"] = "0";

                            dr1["CH_QTY_ONDATE"] = "0";
                            dr1["CH_QTY_TODATE"] = "0";

                            dr1["MOL_PERC_BHY_ONDATE"] = "0";
                            dr1["MOL_PERC_BHY_TODATE"] = "0";

                            dr1["MOL_PERC_CHY_ONDATE"] = "0";
                            dr1["MOL_PERC_CHY_TODATE"] = "0";

                            dr1["MOL_PERC_BCHY_ONDATE"] = "0";
                            dr1["MOL_PERC_BCHY_TODATE"] = "0";

                            dr1["STCANE_PERC_ONDATE"] = "0";
                            dr1["STCANE_PERC_TODATE"] = "0";

                            dr1["BAGASE_PERC_ONDATE"] = "0";
                            dr1["BAGASE_PERC_TODATE"] = "0";

                            dr1["BAGASE_QTY_ONDATE"] = "0";
                            dr1["BAGASE_QTY_TODATE"] = "0";

                            //dr1["ALHL_SYRUP_ONDATE"] = "0";
                            //dr1["ALHL_SYRUP_TODATE"] = "0";

                            //dr1["ALHL_BH_ONDATE"] = "0";
                            //dr1["ALHL_BH_TODATE"] = "0";

                            //dr1["ALHL_CH_ONDATE"] = "0";
                            //dr1["ALHL_CH_TODATE"] = "0";

                            dr1["ALHL_TOTAL_ONDATE"] = "0";
                            dr1["ALHL_TOTAL_TODATE"] = "0";

                            dr1["POWER_PRODUCED_ONDATE"] = "0";
                            dr1["POWER_PRODUCED_TODATE"] = "0";

                            dr1["POWER_EXPORT_ONDATE"] = "0";
                            dr1["POWER_EXPORT_TODATE"] = "0";
                        }
                        DataTable Pdt = obj1.GetPolPercTodate(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (Pdt.Rows.Count > 0)
                        {
                            if (Convert.ToDecimal(Pdt.Rows[0]["PolPercOnDate"].ToString()) > 0)
                            {
                                dr1["POL_PERC_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["PolPercOnDate"].ToString());
                            }
                            else
                            {
                                dr1["POL_PERC_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["PolPercToDate"].ToString()) > 0)
                            {
                                dr1["POL_PERC_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["PolPercToDate"].ToString());
                            }
                            else
                            {
                                dr1["POL_PERC_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["RecPercOnDate"].ToString()) > 0)
                            {
                                dr1["REC_PERC_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["RecPercOnDate"].ToString());
                            }
                            else
                            {
                                dr1["REC_PERC_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["RecPercToDate"].ToString()) > 0)
                            {
                                dr1["REC_PERC_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["RecPercToDate"].ToString());
                            }
                            else
                            {
                                dr1["REC_PERC_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["ProductionOnDate"].ToString()) > 0)
                            {
                                dr1["SG_PROD_ONDATE"] = Pdt.Rows[0]["ProductionOnDate"].ToString();
                            }
                            else
                            {
                                dr1["SG_PROD_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["ProductionToDate"].ToString()) > 0)
                            {
                                dr1["SG_PROD_TODATE"] = Pdt.Rows[0]["ProductionToDate"].ToString();
                            }
                            else
                            {
                                dr1["SG_PROD_TODATE"] = 0;
                            }

                            if (Convert.ToDecimal(Pdt.Rows[0]["SteamPercOnDate"].ToString()) > 0)
                            {
                                dr1["STCANE_PERC_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["SteamPercOnDate"].ToString());
                            }
                            else
                            {
                                dr1["STCANE_PERC_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["SteamPercToDate"].ToString()) > 0)
                            {
                                dr1["STCANE_PERC_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["SteamPercToDate"].ToString());
                            }
                            else

                            {
                                dr1["STCANE_PERC_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["BagassePercOnDate"].ToString()) > 0 || Convert.ToDecimal(Pdt.Rows[0]["BagassePercOnDate"].ToString()) < 0)
                            {
                                dr1["BAGASE_PERC_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["BagassePercOnDate"].ToString());
                            }
                            else
                            {
                                dr1["BAGASE_PERC_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["BagassePercToDate"].ToString()) > 0 || Convert.ToDecimal(Pdt.Rows[0]["BagassePercOnDate"].ToString()) < 0)
                            {
                                dr1["BAGASE_PERC_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["BagassePercToDate"].ToString());
                            }
                            else
                            {
                                dr1["BAGASE_PERC_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["BagasseQtyOnDate"].ToString()) > 0 || Convert.ToDecimal(Pdt.Rows[0]["BagasseQtyOnDate"].ToString()) < 0)
                            {
                                dr1["BAGASE_QTY_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["BagasseQtyOnDate"].ToString());
                            }
                            else
                            {
                                dr1["BAGASE_QTY_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["BagasseQtyToDate"].ToString()) > 0 || Convert.ToDecimal(Pdt.Rows[0]["BagasseQtyToDate"].ToString()) < 0)
                            {
                                dr1["BAGASE_QTY_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["BagasseQtyToDate"].ToString());
                            }
                            else
                            {
                                dr1["BAGASE_QTY_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["PowerProducedKwhOnDate"].ToString()) > 0)
                            {
                                dr1["POWER_PRODUCED_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["PowerProducedKwhOnDate"].ToString());
                            }
                            else
                            {
                                dr1["POWER_PRODUCED_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["PowerProducedKwhToDate"].ToString()) > 0)
                            {
                                dr1["POWER_PRODUCED_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["PowerProducedKwhToDate"].ToString());
                            }
                            else
                            {
                                dr1["POWER_PRODUCED_TODATE"] = 0;
                            }

                            if (Convert.ToDecimal(Pdt.Rows[0]["PowerExportKwhOnDate"].ToString()) > 0)
                            {
                                dr1["POWER_EXPORT_ONDATE"] = Convert.ToDecimal(Pdt.Rows[0]["PowerExportKwhOnDate"].ToString());
                            }
                            else
                            {
                                dr1["POWER_EXPORT_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(Pdt.Rows[0]["PowerExportKwhToDate"].ToString()) > 0)
                            {
                                dr1["POWER_EXPORT_TODATE"] = Convert.ToDecimal(Pdt.Rows[0]["PowerExportKwhToDate"].ToString());
                            }
                            else
                            {
                                dr1["POWER_EXPORT_TODATE"] = 0;
                            }
                        }
                        else
                        {
                            dr1["POL_PERC_ONDATE"] = "0";
                            dr1["POL_PERC_TODATE"] = "0";
                            dr1["REC_PERC_ONDATE"] = "0";
                            dr1["REC_PERC_TODATE"] = "0";
                            dr1["SG_PROD_ONDATE"] = "0";
                            dr1["SG_PROD_TODATE"] = "0";
                            dr1["STCANE_PERC_ONDATE"] = "0";
                            dr1["STCANE_PERC_TODATE"] = "0";
                            dr1["BAGASE_PERC_ONDATE"] = "0";
                            dr1["BAGASE_PERC_TODATE"] = "0";
                            dr1["BAGASE_QTY_ONDATE"] = "0";
                            dr1["BAGASE_QTY_TODATE"] = "0";
                            dr1["POWER_PRODUCED_ONDATE"] = "0";
                            dr1["POWER_PRODUCED_TODATE"] = "0";
                            dr1["POWER_EXPORT_ONDATE"] = "0";
                            dr1["POWER_EXPORT_TODATE"] = "0";
                        }

                        //New Code Calculate Bh,Ch,Bh+CH Loss Mol %
                        DataTable Ldt = obj1.GetLossMolPercOndateTodateData(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (Ldt.Rows.Count > 0)
                        {
                            if (Convert.ToDecimal(Ldt.Rows[0]["OnDateBHLossPerc"].ToString()) > 0)
                            {
                                dr1["MOL_PERC_BHY_ONDATE"] = Convert.ToDecimal(Ldt.Rows[0]["OnDateBHLossPerc"].ToString());
                            }
                            else
                            {
                                dr1["MOL_PERC_BHY_ONDATE"] = "0";
                            }
                            if (Convert.ToDecimal(Ldt.Rows[0]["ToDateBHLossPerc"].ToString()) > 0)
                            {
                                dr1["MOL_PERC_BHY_TODATE"] = Convert.ToDecimal(Ldt.Rows[0]["ToDateBHLossPerc"].ToString());
                            }
                            else
                            {
                                dr1["MOL_PERC_BHY_TODATE"] = "0";
                            }
                            if (Convert.ToDecimal(Ldt.Rows[0]["OnDateCHLossPerc"].ToString()) > 0)
                            {
                                dr1["MOL_PERC_CHY_ONDATE"] = Convert.ToDecimal(Ldt.Rows[0]["OnDateCHLossPerc"].ToString());
                            }
                            else
                            {
                                dr1["MOL_PERC_CHY_ONDATE"] = "0";
                            }
                            if (Convert.ToDecimal(Ldt.Rows[0]["ToDateCHLossPerc"].ToString()) > 0)
                            {
                                dr1["MOL_PERC_CHY_TODATE"] = Convert.ToDecimal(Ldt.Rows[0]["ToDateCHLossPerc"].ToString());
                            }
                            else
                            {
                                dr1["MOL_PERC_CHY_TODATE"] = "0";
                            }

                            if (Convert.ToDecimal(Ldt.Rows[0]["TotalOnDateBCH"].ToString()) > 0)
                            {
                                dr1["MOL_PERC_BCHY_ONDATE"] = Convert.ToDecimal(Ldt.Rows[0]["TotalOnDateBCH"].ToString());
                            }
                            else
                            {
                                dr1["MOL_PERC_BCHY_ONDATE"] = "0";
                            }
                            if (Convert.ToDecimal(Ldt.Rows[0]["TotalToDateBCH"].ToString()) > 0)
                            {
                                dr1["MOL_PERC_BCHY_TODATE"] = Convert.ToDecimal(Ldt.Rows[0]["TotalToDateBCH"].ToString());
                            }
                            else
                            {
                                dr1["MOL_PERC_BCHY_TODATE"] = "0";
                            }
                        }
                        else
                        {
                            dr1["MOL_PERC_BHY_ONDATE"] = "0";
                            dr1["MOL_PERC_BHY_TODATE"] = "0";

                            dr1["MOL_PERC_CHY_ONDATE"] = "0";
                            dr1["MOL_PERC_CHY_TODATE"] = "0";

                            dr1["MOL_PERC_BCHY_ONDATE"] = "0";
                            dr1["MOL_PERC_BCHY_TODATE"] = "0";
                        }

                        //New Code Calculate Bh & Ch Perc
                        //DataTable dtBhCh = obj1.GetBHCHPercAndQtyOndateTodateData(dt.Rows[a]["F_Code"].ToString(), dates);
                        DataTable dtBhCh = obj1.GetBHCHPercOndateTodate(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (dtBhCh.Rows.Count > 0)
                        {
                            for (int i = 0; i < dtBhCh.Rows.Count; i++)
                            {
                                if (dtBhCh.Rows[i]["type"].ToString() == "1")
                                {
                                    if (Convert.ToDecimal(dtBhCh.Rows[i]["OnDatePerc"].ToString()) > 0)
                                    {
                                        dr1["BH_PERC_ONDATE"] = Convert.ToDecimal(dtBhCh.Rows[i]["OnDatePerc"].ToString());
                                    }
                                    else
                                    {
                                        dr1["BH_PERC_ONDATE"] = 0;
                                    }
                                    if (Convert.ToDecimal(dtBhCh.Rows[i]["ToDatePerc"].ToString()) > 0)
                                    {
                                        dr1["BH_PERC_TODATE"] = Convert.ToDecimal(dtBhCh.Rows[i]["ToDatePerc"].ToString());
                                    }
                                    else
                                    {
                                        dr1["BH_PERC_TODATE"] = 0;
                                    }
                                }
                                else if (dtBhCh.Rows[i]["type"].ToString() == "2")
                                {
                                    if (Convert.ToDecimal(dtBhCh.Rows[i]["OnDatePerc"].ToString()) > 0)
                                    {
                                        dr1["CH_PERC_ONDATE"] = Convert.ToDecimal(dtBhCh.Rows[i]["OnDatePerc"].ToString());
                                    }
                                    else
                                    {
                                        dr1["CH_PERC_ONDATE"] = 0;
                                    }
                                    if (Convert.ToDecimal(dtBhCh.Rows[i]["ToDatePerc"].ToString()) > 0)
                                    {
                                        dr1["CH_PERC_TODATE"] = Convert.ToDecimal(dtBhCh.Rows[i]["ToDatePerc"].ToString());
                                    }
                                    else
                                    {
                                        dr1["CH_PERC_TODATE"] = 0;
                                    }
                                }
                            }
                            //if (Convert.ToDecimal(dtBhCh.Rows[0]["OnDateBHPerc"].ToString()) > 0)
                            //{
                            //    dr1["BH_PERC_ONDATE"] = Convert.ToDecimal(dtBhCh.Rows[0]["OnDateBHPerc"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["BH_PERC_ONDATE"] = 0;
                            //}
                            //if(Convert.ToDecimal(dtBhCh.Rows[0]["ToDateBHPerc"].ToString()) > 0)
                            //{
                            //    dr1["BH_PERC_TODATE"] = Convert.ToDecimal(dtBhCh.Rows[0]["ToDateBHPerc"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["BH_PERC_TODATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtBhCh.Rows[0]["OnDateCHPerc"].ToString()) > 0)
                            //{
                            //    dr1["CH_PERC_ONDATE"] = Convert.ToDecimal(dtBhCh.Rows[0]["OnDateCHPerc"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["CH_PERC_ONDATE"] = 0;
                            //}
                            //if (Convert.ToDecimal(dtBhCh.Rows[0]["ToDateCHPerc"].ToString()) > 0)
                            //{
                            //    dr1["CH_PERC_TODATE"] = Convert.ToDecimal(dtBhCh.Rows[0]["ToDateCHPerc"].ToString());
                            //}
                            //else
                            //{
                            //    dr1["CH_PERC_TODATE"] = 0;
                            //}
                        }
                        else
                        {
                            dr1["BH_PERC_ONDATE"] = 0;
                            dr1["BH_PERC_TODATE"] = 0;
                            dr1["CH_PERC_ONDATE"] = 0;
                            dr1["CH_PERC_TODATE"] = 0;
                        }
                        //calculate Bh & Ch Quantity
                        DataTable dtBhChQty = obj1.GetBHCHQtlsOndateTodate(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (dtBhChQty.Rows.Count > 0)
                        {
                            if (Convert.ToDecimal(dtBhChQty.Rows[0]["OnDateBHQty"].ToString()) > 0)
                            {
                                dr1["BH_QTY_ONDATE"] = Convert.ToDecimal(dtBhChQty.Rows[0]["OnDateBHQty"].ToString());
                            }
                            else
                            {
                                dr1["BH_QTY_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(dtBhChQty.Rows[0]["ToDateBHQty"].ToString()) > 0)
                            {
                                dr1["BH_QTY_TODATE"] = Convert.ToDecimal(dtBhChQty.Rows[0]["ToDateBHQty"].ToString());
                            }
                            else
                            {
                                dr1["BH_QTY_TODATE"] = 0;
                            }

                            if (Convert.ToDecimal(dtBhChQty.Rows[0]["OnDateCHQty"].ToString()) > 0)
                            {
                                dr1["CH_QTY_ONDATE"] = Convert.ToDecimal(dtBhChQty.Rows[0]["OnDateCHQty"].ToString());
                            }
                            else
                            {
                                dr1["CH_QTY_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(dtBhChQty.Rows[0]["ToDateCHQty"].ToString()) > 0)
                            {
                                dr1["CH_QTY_TODATE"] = Convert.ToDecimal(dtBhChQty.Rows[0]["ToDateCHQty"].ToString());
                            }
                            else
                            {
                                dr1["CH_QTY_TODATE"] = 0;
                            }
                        }
                        else
                        {
                            dr1["BH_QTY_ONDATE"] = 0;
                            dr1["BH_QTY_TODATE"] = 0;
                            dr1["CH_QTY_ONDATE"] = 0;
                            dr1["CH_QTY_TODATE"] = 0;
                        }
                        decimal ttalc = 0;
                        decimal tonalc = 0;
                        decimal ttdalc = 0;

                        //new code alcohol
                        DataTable dtAL = obj1.GetAlcohoOndateTodateData(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (dtAL.Rows.Count > 0)
                        {
                            //ondate
                            if (Convert.ToDecimal(dtAL.Rows[0]["OnDateSycrup"].ToString()) > 0)
                            {
                                //dr1["ALHL_SYRUP_ONDATE"] = Convert.ToDecimal(dtAL.Rows[0]["OnDateSycrup"].ToString());
                                tonalc += Convert.ToDecimal(dtAL.Rows[0]["OnDateSycrup"].ToString());
                            }
                            else
                            {
                                //dr1["ALHL_SYRUP_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(dtAL.Rows[0]["OnDateBH"].ToString()) > 0)
                            {
                                //dr1["ALHL_BH_ONDATE"] = Convert.ToDecimal(dtAL.Rows[0]["OnDateBH"].ToString());
                                tonalc += Convert.ToDecimal(dtAL.Rows[0]["OnDateBH"].ToString());
                            }
                            else
                            {
                                //dr1["ALHL_BH_ONDATE"] = 0;
                            }
                            if (Convert.ToDecimal(dtAL.Rows[0]["OnDateCH"].ToString()) > 0)
                            {
                                //dr1["ALHL_CH_ONDATE"] = Convert.ToDecimal(dtAL.Rows[0]["OnDateCH"].ToString());
                                tonalc += Convert.ToDecimal(dtAL.Rows[0]["OnDateCH"].ToString());
                            }
                            else
                            {
                                // dr1["ALHL_CH_ONDATE"] = 0;
                            }
                            //todate
                            if (Convert.ToDecimal(dtAL.Rows[0]["ToDateSycrup"].ToString()) > 0)
                            {
                                //dr1["ALHL_SYRUP_TODATE"] = Convert.ToDecimal(dtAL.Rows[0]["ToDateSycrup"].ToString());
                                ttdalc += Convert.ToDecimal(dtAL.Rows[0]["ToDateSycrup"].ToString());
                            }
                            else
                            {
                                // dr1["ALHL_SYRUP_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(dtAL.Rows[0]["ToDateBH"].ToString()) > 0)
                            {
                                //dr1["ALHL_BH_TODATE"] = Convert.ToDecimal(dtAL.Rows[0]["ToDateBH"].ToString());
                                ttdalc += Convert.ToDecimal(dtAL.Rows[0]["ToDateBH"].ToString());
                            }
                            else
                            {
                                // dr1["ALHL_BH_TODATE"] = 0;
                            }
                            if (Convert.ToDecimal(dtAL.Rows[0]["ToDateCH"].ToString()) > 0)
                            {
                                //dr1["ALHL_CH_TODATE"] = Convert.ToDecimal(dtAL.Rows[0]["ToDateCH"].ToString());
                                ttdalc += Convert.ToDecimal(dtAL.Rows[0]["ToDateCH"].ToString());
                            }
                            else
                            {
                                //dr1["ALHL_CH_TODATE"] = 0;
                            }
                            dr1["ALHL_TOTAL_ONDATE"] = tonalc;
                            dr1["ALHL_TOTAL_TODATE"] = ttdalc;
                        }
                        else
                        {
                            // dr1["ALHL_SYRUP_ONDATE"] = 0;
                            // dr1["ALHL_BH_ONDATE"] = 0;
                            //dr1["ALHL_CH_ONDATE"] = 0;
                            dr1["ALHL_TOTAL_ONDATE"] = 0;

                            //dr1["ALHL_SYRUP_TODATE"] = 0;
                            //dr1["ALHL_BH_TODATE"] = 0;
                            // dr1["ALHL_CH_TODATE"] = 0;
                            dr1["ALHL_TOTAL_TODATE"] = 0;
                        }

                        //zone wise PolPerc Total Ondate
                        DataTable CrushDt = obj1.GetOndateTodateCruch(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (CrushDt.Rows.Count > 0)
                        {

                            OndateCrush = (Convert.ToDecimal(CrushDt.Rows[0]["OndateCrush"].ToString()));
                            TodateCrush = (Convert.ToDecimal(CrushDt.Rows[0]["TodateCrush"].ToString()));

                            BHSLptcrrctotal = BHSLptcrrctotal + (OndateCrush * Convert.ToDecimal(dr1["REC_PERC_ONDATE"].ToString()));
                            BHSLptcrondate = BHSLptcrondate + OndateCrush;
                            BHSLptcrrcTodatetotal = BHSLptcrrcTodatetotal + (TodateCrush * Convert.ToDecimal(dr1["REC_PERC_TODATE"].ToString()));
                            BHSLptcrTodate = BHSLptcrTodate + TodateCrush;

                            BHSLPolOnDatePerTotal = BHSLPolOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["POL_PERC_ONDATE"].ToString()));
                            BHSLPolOnDateCrush = BHSLPolOnDateCrush + OndateCrush;
                            BHSLPolToDatePerTotal = BHSLPolToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["POL_PERC_TODATE"].ToString()));
                            BHSLPolToDateCrush = BHSLPolToDateCrush + TodateCrush;

                            BHSLSTOnDatePerTotal = BHSLSTOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["STCANE_PERC_ONDATE"].ToString()));
                            BHSLSTOnDateCrush = BHSLSTOnDateCrush + OndateCrush;
                            BHSLSTToDatePerTotal = BHSLSTToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["STCANE_PERC_TODATE"].ToString()));
                            BHSLSTToDateCrush = BHSLSTToDateCrush + TodateCrush;

                            BHSLBGOnDatePerTotal = BHSLBGOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_ONDATE"].ToString()));
                            BHSLBGOnDateCrush = BHSLBGOnDateCrush + OndateCrush;
                            BHSLBGToDatePerTotal = BHSLBGToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_TODATE"].ToString()));
                            BHSLBGToDateCrush = BHSLBGToDateCrush + TodateCrush;

                            if (a <= 4)
                            {

                                //WZ Recovery perc Ondate/Todate
                                WZptcrrctotal = WZptcrrctotal + (OndateCrush * Convert.ToDecimal(dr1["REC_PERC_ONDATE"].ToString()));
                                WZptcrondate = WZptcrondate + OndateCrush;
                                WZRecCanceToDate = WZRecCanceToDate + (TodateCrush * Convert.ToDecimal(dr1["REC_PERC_TODATE"].ToString()));
                                WZCCToDate = WZCCToDate + TodateCrush;

                                //WZ pol perc Ondate/Todate
                                WZPolOnDatePerTotal = WZPolOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["POL_PERC_ONDATE"].ToString()));
                                WZPolOnDateCrush = WZPolOnDateCrush + OndateCrush;
                                WZPolToDatePerTotal = WZPolToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["POL_PERC_TODATE"].ToString()));
                                WZPolToDateCrush = WZPolToDateCrush + TodateCrush;

                                //WZ Stcane per ondate/todate
                                WZSTOnDatePerTotal = WZSTOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["STCANE_PERC_ONDATE"].ToString()));
                                WZSTOnDateCrush = WZSTOnDateCrush + OndateCrush;
                                WZSTToDatePerTotal = WZSTToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["STCANE_PERC_TODATE"].ToString()));
                                WZSTToDateCrush = WZSTToDateCrush + TodateCrush;

                                //WZ Bagasse per ondate/todate
                                WZBGOnDatePerTotal = WZBGOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_ONDATE"].ToString()));
                                WZBGOnDateCrush = WZBGOnDateCrush + OndateCrush;
                                WZBGToDatePerTotal = WZBGToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_TODATE"].ToString()));
                                WZBGToDateCrush = WZBGToDateCrush + TodateCrush;
                            }
                            else if (a >= 5 && a <= 9)
                            {
                                //CZ Recovery perc Ondate/Todate
                                CZptcrrctotal = CZptcrrctotal + (OndateCrush * Convert.ToDecimal(dr1["REC_PERC_ONDATE"].ToString()));
                                CZptcrondate = CZptcrondate + OndateCrush;
                                CZRecCanceToDate = CZRecCanceToDate + (TodateCrush * Convert.ToDecimal(dr1["REC_PERC_TODATE"].ToString()));
                                CZCCToDate = CZCCToDate + TodateCrush;

                                //CZ pol perc Ondate/Todate
                                CZPolOnDatePerTotal = CZPolOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["POL_PERC_ONDATE"].ToString()));
                                CZPolOnDateCrush = CZPolOnDateCrush + OndateCrush;
                                CZPolToDatePerTotal = CZPolToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["POL_PERC_TODATE"].ToString()));
                                CZPolToDateCrush = CZPolToDateCrush + TodateCrush;

                                //CZ Stcane per ondate/todate
                                CZSTOnDatePerTotal = CZSTOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["STCANE_PERC_ONDATE"].ToString()));
                                CZSTOnDateCrush = CZSTOnDateCrush + OndateCrush;
                                CZSTToDatePerTotal = CZSTToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["STCANE_PERC_TODATE"].ToString()));
                                CZSTToDateCrush = CZSTToDateCrush + TodateCrush;

                                //CZ Bagasse per ondate/todate
                                CZBGOnDatePerTotal = CZBGOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_ONDATE"].ToString()));
                                CZBGOnDateCrush = CZBGOnDateCrush + OndateCrush;
                                CZBGToDatePerTotal = CZBGToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_TODATE"].ToString()));
                                CZBGToDateCrush = CZBGToDateCrush + TodateCrush;
                            }
                            else if (a >= 9 && a <= 13)
                            {

                                //EZ Recovery perc Ondate/Todate
                                EZptcrrctotal = EZptcrrctotal + (OndateCrush * Convert.ToDecimal(dr1["REC_PERC_ONDATE"].ToString()));
                                EZptcrondate = EZptcrondate + OndateCrush;
                                EZRecCanceToDate = EZRecCanceToDate + (TodateCrush * Convert.ToDecimal(dr1["REC_PERC_TODATE"].ToString()));
                                EZCCToDate = EZCCToDate + TodateCrush;

                                //EZ pol perc Ondate/Todate
                                EZPolOnDatePerTotal = EZPolOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["POL_PERC_ONDATE"].ToString()));
                                EZPolOnDateCrush = EZPolOnDateCrush + OndateCrush;
                                EZPolToDatePerTotal = EZPolToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["POL_PERC_TODATE"].ToString()));
                                EZPolToDateCrush = EZPolToDateCrush + TodateCrush;

                                //CZ Stcane per ondate/todate
                                EZSTOnDatePerTotal = EZSTOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["STCANE_PERC_ONDATE"].ToString()));
                                EZSTOnDateCrush = EZSTOnDateCrush + OndateCrush;
                                EZSTToDatePerTotal = EZSTToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["STCANE_PERC_TODATE"].ToString()));
                                EZSTToDateCrush = EZSTToDateCrush + TodateCrush;

                                //EZ Bagasse per ondate/todate
                                EZBGOnDatePerTotal = EZBGOnDatePerTotal + (OndateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_ONDATE"].ToString()));
                                EZBGOnDateCrush = EZBGOnDateCrush + OndateCrush;
                                EZBGToDatePerTotal = EZBGToDatePerTotal + (TodateCrush * Convert.ToDecimal(dr1["BAGASE_PERC_TODATE"].ToString()));
                                EZBGToDateCrush = EZBGToDateCrush + TodateCrush;
                            }
                        }
                        //pol
                        if (WZPolOnDatePerTotal > 0 && WZPolOnDateCrush > 0)
                        {
                            WZPolOnDatePerc = Math.Round((WZPolOnDatePerTotal / WZPolOnDateCrush), 2);

                        }
                        if (WZPolToDatePerTotal > 0 && WZPolToDateCrush > 0)
                        {
                            WZPolToDatePerc = Math.Round((WZPolToDatePerTotal / WZPolToDateCrush), 2);
                        }
                        if (CZPolOnDatePerTotal > 0 && CZPolOnDateCrush > 0)
                        {
                            CZPolOnDatePerc = Math.Round((CZPolOnDatePerTotal / CZPolOnDateCrush), 2);
                        }
                        if (CZPolToDatePerTotal > 0 && CZPolToDateCrush > 0)
                        {
                            CZPolToDatePerc = Math.Round((CZPolToDatePerTotal / CZPolToDateCrush), 2);
                        }
                        if (EZPolOnDatePerTotal > 0 && EZPolOnDateCrush > 0)
                        {
                            EZPolOnDatePerc = Math.Round((EZPolOnDatePerTotal / EZPolOnDateCrush), 2);

                        }
                        if (EZPolToDatePerTotal > 0 && EZPolToDateCrush > 0)
                        {
                            EZPolToDatePerc = Math.Round((EZPolToDatePerTotal / EZPolToDateCrush), 2);
                        }
                        if (BHSLPolOnDatePerTotal > 0 && BHSLPolOnDateCrush > 0)
                        {
                            BHSLPolOnDatePerc = Math.Round((BHSLPolOnDatePerTotal / BHSLPolOnDateCrush), 2);
                        }
                        if (BHSLPolToDatePerTotal > 0 && BHSLPolToDateCrush > 0)
                        {
                            BHSLPolToDatePerc = Math.Round((BHSLPolToDatePerTotal / BHSLPolToDateCrush), 2);
                        }
                        //stcane
                        if (WZSTOnDatePerTotal > 0 && WZSTOnDateCrush > 0)
                        {
                            WZSTOnDatePerc = Math.Round((WZSTOnDatePerTotal / WZSTOnDateCrush), 2);

                        }
                        if (WZSTToDatePerTotal > 0 && WZSTToDateCrush > 0)
                        {
                            WZSTToDatePerc = Math.Round((WZSTToDatePerTotal / WZSTToDateCrush), 2);
                        }
                        if (CZSTOnDatePerTotal > 0 && CZSTOnDateCrush > 0)
                        {
                            CZSTOnDatePerc = Math.Round((CZSTOnDatePerTotal / CZSTOnDateCrush), 2);
                        }
                        if (CZSTToDatePerTotal > 0 && CZSTToDateCrush > 0)
                        {
                            CZSTToDatePerc = Math.Round((CZSTToDatePerTotal / CZSTToDateCrush), 2);
                        }
                        if (EZSTOnDatePerTotal > 0 && EZSTOnDateCrush > 0)
                        {
                            EZSTOnDatePerc = Math.Round((EZSTOnDatePerTotal / EZSTOnDateCrush), 2);
                        }
                        if (EZSTToDatePerTotal > 0 && EZSTToDateCrush > 0)
                        {
                            EZSTToDatePerc = Math.Round((EZSTToDatePerTotal / EZSTToDateCrush), 2);
                        }
                        if (BHSLSTOnDatePerTotal > 0 && BHSLSTOnDateCrush > 0)
                        {
                            BHSLSTOnDatePerc = Math.Round((BHSLSTOnDatePerTotal / BHSLSTOnDateCrush), 2);
                        }
                        if (BHSLSTToDatePerTotal > 0 && BHSLSTToDateCrush > 0)
                        {
                            BHSLSTToDatePerc = Math.Round((BHSLSTToDatePerTotal / BHSLSTToDateCrush), 2);
                        }
                        //Bagasse

                        if (WZBGOnDatePerTotal > 0 && WZBGOnDateCrush > 0)
                        {
                            WZBGOnDatePerc = Math.Round((WZBGOnDatePerTotal / WZBGOnDateCrush), 2);
                        }
                        if (WZBGToDatePerTotal > 0 && WZBGToDateCrush > 0)
                        {
                            WZBGToDatePerc = Math.Round((WZBGToDatePerTotal / WZBGToDateCrush), 2);
                        }
                        if (CZBGOnDatePerTotal > 0 && CZBGOnDateCrush > 0)
                        {
                            CZBGOnDatePerc = Math.Round((CZBGOnDatePerTotal / CZBGOnDateCrush), 2);
                        }
                        if (CZBGToDatePerTotal > 0 && CZBGToDateCrush > 0)
                        {
                            CZBGToDatePerc = Math.Round((CZBGToDatePerTotal / CZBGToDateCrush), 2);
                        }
                        if (EZBGOnDatePerTotal > 0 && EZBGOnDateCrush > 0)
                        {
                            EZBGOnDatePerc = Math.Round((EZBGOnDatePerTotal / EZBGOnDateCrush), 2);
                        }
                        if (EZBGToDatePerTotal > 0 && EZBGToDateCrush > 0)
                        {
                            EZBGToDatePerc = Math.Round((EZBGToDatePerTotal / EZBGToDateCrush), 2);
                        }
                        if (BHSLBGOnDatePerTotal > 0 && BHSLBGOnDateCrush > 0)
                        {
                            BHSLBGOnDatePerc = Math.Round((BHSLBGOnDatePerTotal / BHSLBGOnDateCrush), 2);
                        }
                        if (BHSLBGToDatePerTotal > 0 && BHSLBGToDateCrush > 0)
                        {
                            BHSLBGToDatePerc = Math.Round((BHSLBGToDatePerTotal / BHSLBGToDateCrush), 2);
                        }
                        //Recovery
                        if (WZptcrrctotal > 0 && WZptcrondate > 0)
                        {
                            WZprcpreondate = Math.Round((WZptcrrctotal / WZptcrondate), 2);
                        }
                        if (WZRecCanceToDate > 0 && WZCCToDate > 0)
                        {
                            WZRecPercToDate = Math.Round((WZRecCanceToDate / WZCCToDate), 2);
                        }
                        if (CZptcrrctotal > 0 && CZptcrondate > 0)
                        {
                            CZprcpreondate = Math.Round((CZptcrrctotal / CZptcrondate), 2);
                        }
                        if (CZRecCanceToDate > 0 && CZCCToDate > 0)
                        {
                            CZRecPercToDate = Math.Round((CZRecCanceToDate / CZCCToDate), 2);
                        }
                        if (EZptcrrctotal > 0 && EZptcrondate > 0)
                        {
                            EZprcpreondate = Math.Round((EZptcrrctotal / EZptcrondate), 2);

                        }
                        if (EZRecCanceToDate > 0 && EZCCToDate > 0)
                        {
                            EZRecPercToDate = Math.Round((EZRecCanceToDate / EZCCToDate), 2);
                        }

                        if (BHSLptcrrctotal > 0 && BHSLptcrondate > 0)
                        {
                            BHSLprcpreondate = Math.Round((BHSLptcrrctotal / BHSLptcrondate), 2);

                        }
                        if (BHSLptcrrcTodatetotal > 0 && BHSLptcrTodate > 0)
                        {
                            BHSLprcpreTodate = Math.Round((BHSLptcrrcTodatetotal / BHSLptcrTodate), 2);
                        }
                        // zone wise bh%  and ch% total
                        DataTable Tdt = obj1.GetBhChCaneCrush(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (Tdt.Rows.Count > 0)
                        {
                            for (int i = 0; i < Tdt.Rows.Count; i++)
                            {
                                if (Tdt.Rows[i]["type"].ToString() == "1")
                                {
                                    decimal BhOnDate = Convert.ToDecimal(Tdt.Rows[i]["OnDate"].ToString());
                                    decimal BhToDate = Convert.ToDecimal(Tdt.Rows[i]["ToDate"].ToString());

                                    BHSLBHOnDatePerTotal = BHSLBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["BH_PERC_ONDATE"].ToString()));
                                    BHSLBHOnDateCrush = BHSLBHOnDateCrush + BhOnDate;
                                    BHSLBHToDatePerTotal = BHSLBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["BH_PERC_TODATE"].ToString()));
                                    BHSLBHToDateCrush = BHSLBHToDateCrush + BhToDate;

                                    BHSLLMBHOnDatePerTotal = BHSLLMBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_ONDATE"].ToString()));
                                    BHSLLMBHOnDateCrush = BHSLLMBHOnDateCrush + BhOnDate;
                                    BHSLLMBHToDatePerTotal = BHSLLMBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_TODATE"].ToString()));
                                    BHSLLMBHToDateCrush = BHSLLMBHToDateCrush + BhToDate;

                                    if (a <= 4)
                                    {
                                        WZBHOnDatePerTotal = WZBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["BH_PERC_ONDATE"].ToString()));
                                        WZBHOnDateCrush = WZBHOnDateCrush + BhOnDate;
                                        WZBHToDatePerTotal = WZBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["BH_PERC_TODATE"].ToString()));
                                        WZBHToDateCrush = WZBHToDateCrush + BhToDate;

                                        WZLMBHOnDatePerTotal = WZLMBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_ONDATE"].ToString()));
                                        WZLMBHOnDateCrush = WZLMBHOnDateCrush + BhOnDate;
                                        WZLMBHToDatePerTotal = WZLMBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_TODATE"].ToString()));
                                        WZLMBHToDateCrush = WZLMBHToDateCrush + BhToDate;
                                    }
                                    else if (a >= 5 && a <= 9)
                                    {
                                        CZBHOnDatePerTotal = CZBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["BH_PERC_ONDATE"].ToString()));
                                        CZBHOnDateCrush = CZBHOnDateCrush + BhOnDate;
                                        CZBHToDatePerTotal = CZBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["BH_PERC_TODATE"].ToString()));
                                        CZBHToDateCrush = CZBHToDateCrush + BhToDate;

                                        CZLMBHOnDatePerTotal = CZLMBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_ONDATE"].ToString()));
                                        CZLMBHOnDateCrush = CZLMBHOnDateCrush + BhOnDate;
                                        CZLMBHToDatePerTotal = CZLMBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_TODATE"].ToString()));
                                        CZLMBHToDateCrush = CZLMBHToDateCrush + BhToDate;
                                    }
                                    else if (a >= 9 && a <= 13)
                                    {
                                        EZBHOnDatePerTotal = EZBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["BH_PERC_ONDATE"].ToString()));
                                        EZBHOnDateCrush = EZBHOnDateCrush + BhOnDate;
                                        EZBHToDatePerTotal = EZBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["BH_PERC_TODATE"].ToString()));
                                        EZBHToDateCrush = EZBHToDateCrush + BhToDate;

                                        EZLMBHOnDatePerTotal = EZLMBHOnDatePerTotal + (BhOnDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_ONDATE"].ToString()));
                                        EZLMBHOnDateCrush = EZLMBHOnDateCrush + BhOnDate;
                                        EZLMBHToDatePerTotal = EZLMBHToDatePerTotal + (BhToDate * Convert.ToDecimal(dr1["MOL_PERC_BHY_TODATE"].ToString()));
                                        EZLMBHToDateCrush = EZLMBHToDateCrush + BhToDate;
                                    }

                                }
                                else if (Tdt.Rows[i]["type"].ToString() == "2")
                                {
                                    decimal ChOnDate = Convert.ToDecimal(Tdt.Rows[i]["OnDate"].ToString());
                                    decimal ChToDate = Convert.ToDecimal(Tdt.Rows[i]["ToDate"].ToString());

                                    BHSLCHOnDatePerTotal = BHSLCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["CH_PERC_ONDATE"].ToString()));
                                    BHSLCHOnDateCrush = BHSLCHOnDateCrush + ChOnDate;
                                    BHSLCHToDatePerTotal = BHSLCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["CH_PERC_TODATE"].ToString()));
                                    BHSLCHToDateCrush = BHSLCHToDateCrush + ChToDate;

                                    BHSLLMCHOnDatePerTotal = BHSLLMCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_ONDATE"].ToString()));
                                    BHSLLMCHOnDateCrush = BHSLLMCHOnDateCrush + ChOnDate;
                                    BHSLLMCHToDatePerTotal = BHSLLMCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_TODATE"].ToString()));
                                    BHSLLMCHToDateCrush = BHSLLMCHToDateCrush + ChToDate;
                                    if (a <= 4)
                                    {
                                        WZCHOnDatePerTotal = WZCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["CH_PERC_ONDATE"].ToString()));
                                        WZCHOnDateCrush = WZCHOnDateCrush + ChOnDate;
                                        WZCHToDatePerTotal = WZCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["CH_PERC_TODATE"].ToString()));
                                        WZCHToDateCrush = WZCHToDateCrush + ChToDate;

                                        WZLMCHOnDatePerTotal = WZLMCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_ONDATE"].ToString()));
                                        WZLMCHOnDateCrush = WZLMCHOnDateCrush + ChOnDate;
                                        WZLMCHToDatePerTotal = WZLMCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_TODATE"].ToString()));
                                        WZLMCHToDateCrush = WZLMCHToDateCrush + ChToDate;
                                    }
                                    else if (a >= 5 && a <= 9)
                                    {
                                        CZCHOnDatePerTotal = CZCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["CH_PERC_ONDATE"].ToString()));
                                        CZCHOnDateCrush = CZCHOnDateCrush + ChOnDate;
                                        CZCHToDatePerTotal = CZCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["CH_PERC_TODATE"].ToString()));
                                        CZCHToDateCrush = CZCHToDateCrush + ChToDate;

                                        CZLMCHOnDatePerTotal = CZLMCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_ONDATE"].ToString()));
                                        CZLMCHOnDateCrush = CZLMCHOnDateCrush + ChOnDate;
                                        CZLMCHToDatePerTotal = CZLMCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_TODATE"].ToString()));
                                        CZLMCHToDateCrush = CZLMCHToDateCrush + ChToDate;
                                    }
                                    else if (a >= 9 && a <= 13)
                                    {
                                        EZCHOnDatePerTotal = EZCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["CH_PERC_ONDATE"].ToString()));
                                        EZCHOnDateCrush = EZCHOnDateCrush + ChOnDate;
                                        EZCHToDatePerTotal = EZCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["CH_PERC_TODATE"].ToString()));
                                        EZCHToDateCrush = EZCHToDateCrush + ChToDate;

                                        EZLMCHOnDatePerTotal = EZLMCHOnDatePerTotal + (ChOnDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_ONDATE"].ToString()));
                                        EZLMCHOnDateCrush = EZLMCHOnDateCrush + ChOnDate;
                                        EZLMCHToDatePerTotal = EZLMCHToDatePerTotal + (ChToDate * Convert.ToDecimal(dr1["MOL_PERC_CHY_TODATE"].ToString()));
                                        EZLMCHToDateCrush = EZLMCHToDateCrush + ChToDate;
                                    }

                                }
                            }


                        }
                        //BH%
                        if (WZBHOnDatePerTotal > 0 && WZBHOnDateCrush > 0)
                        {
                            WZBHOnDatePerc = Math.Round((WZBHOnDatePerTotal / WZBHOnDateCrush), 2);
                        }
                        if (WZBHToDatePerTotal > 0 && WZBHToDateCrush > 0)
                        {
                            WZBHToDatePerc = Math.Round((WZBHToDatePerTotal / WZBHToDateCrush), 2);
                        }
                        if (CZBHOnDatePerTotal > 0 && CZBHOnDateCrush > 0)
                        {
                            CZBHOnDatePerc = Math.Round((CZBHOnDatePerTotal / CZBHOnDateCrush), 2);
                        }
                        if (CZBHToDatePerTotal > 0 && CZBHToDateCrush > 0)
                        {
                            CZBHToDatePerc = Math.Round((CZBHToDatePerTotal / CZBHToDateCrush), 2);
                        }
                        if (EZBHOnDatePerTotal > 0 && EZBHOnDateCrush > 0)
                        {
                            EZBHOnDatePerc = Math.Round((EZBHOnDatePerTotal / EZBHOnDateCrush), 2);
                        }
                        if (EZBHToDatePerTotal > 0 && EZBHToDateCrush > 0)
                        {
                            EZBHToDatePerc = Math.Round((EZBHToDatePerTotal / EZBHToDateCrush), 2);
                        }
                        if (BHSLBHOnDatePerTotal > 0 && BHSLBHOnDateCrush > 0)
                        {
                            BHSLBHOnDatePerc = Math.Round((BHSLBHOnDatePerTotal / BHSLBHOnDateCrush), 2);
                        }
                        if (BHSLBHToDatePerTotal > 0 && BHSLBHToDateCrush > 0)
                        {
                            BHSLBHToDatePerc = Math.Round((BHSLBHToDatePerTotal / BHSLBHToDateCrush), 2);
                        }

                        //CH%
                        if (WZCHOnDatePerTotal > 0 && WZCHOnDateCrush > 0)
                        {
                            WZCHOnDatePerc = Math.Round((WZCHOnDatePerTotal / WZCHOnDateCrush), 2);
                        }
                        if (WZCHToDatePerTotal > 0 && WZCHToDateCrush > 0)
                        {
                            WZCHToDatePerc = Math.Round((WZCHToDatePerTotal / WZCHToDateCrush), 2);
                        }
                        if (CZCHOnDatePerTotal > 0 && CZCHOnDateCrush > 0)
                        {
                            CZCHOnDatePerc = Math.Round((CZCHOnDatePerTotal / CZCHOnDateCrush), 2);

                        }
                        if (CZCHToDatePerTotal > 0 && CZCHToDateCrush > 0)
                        {
                            CZCHToDatePerc = Math.Round((CZCHToDatePerTotal / CZCHToDateCrush), 2);
                        }
                        if (EZCHOnDatePerTotal > 0 && EZCHOnDateCrush > 0)
                        {
                            EZCHOnDatePerc = Math.Round((EZCHOnDatePerTotal / EZCHOnDateCrush), 2);

                        }
                        if (EZCHToDatePerTotal > 0 && EZCHToDateCrush > 0)
                        {
                            EZCHToDatePerc = Math.Round((EZCHToDatePerTotal / EZCHToDateCrush), 2);
                        }
                        if (BHSLCHOnDatePerTotal > 0 && BHSLCHOnDateCrush > 0)
                        {
                            BHSLCHOnDatePerc = Math.Round((BHSLCHOnDatePerTotal / BHSLCHOnDateCrush), 2);
                        }
                        if (BHSLCHToDatePerTotal > 0 && BHSLCHToDateCrush > 0)
                        {
                            BHSLCHToDatePerc = Math.Round((BHSLCHToDatePerTotal / BHSLCHToDateCrush), 2);
                        }

                        //LMOS BH
                        if (WZLMBHOnDatePerTotal > 0 && WZLMBHOnDateCrush > 0)
                        {
                            WZLMBHOnDatePerc = Math.Round((WZLMBHOnDatePerTotal / WZLMBHOnDateCrush), 2);
                        }
                        if (WZLMBHToDatePerTotal > 0 && WZLMBHToDateCrush > 0)
                        {
                            WZLMBHToDatePerc = Math.Round((WZLMBHToDatePerTotal / WZLMBHToDateCrush), 2);
                        }
                        if (CZLMBHOnDatePerTotal > 0 && CZLMBHOnDateCrush > 0)
                        {
                            CZLMBHOnDatePerc = Math.Round((CZLMBHOnDatePerTotal / CZLMBHOnDateCrush), 2);
                        }
                        if (CZLMBHToDatePerTotal > 0 && CZLMBHToDateCrush > 0)
                        {
                            CZLMBHToDatePerc = Math.Round((CZLMBHToDatePerTotal / CZLMBHToDateCrush), 2);
                        }
                        if (EZLMBHOnDatePerTotal > 0 && EZLMBHOnDateCrush > 0)
                        {
                            EZLMBHOnDatePerc = Math.Round((EZLMBHOnDatePerTotal / EZLMBHOnDateCrush), 2);
                        }
                        if (EZLMBHToDatePerTotal > 0 && EZLMBHToDateCrush > 0)
                        {
                            EZLMBHToDatePerc = Math.Round((EZLMBHToDatePerTotal / EZLMBHToDateCrush), 2);
                        }
                        if (BHSLLMBHOnDatePerTotal > 0 && BHSLLMBHOnDateCrush > 0)
                        {
                            BHSLLMBHOnDatePerc = Math.Round((BHSLLMBHOnDatePerTotal / BHSLLMBHOnDateCrush), 2);
                        }
                        if (BHSLLMBHToDatePerTotal > 0 && BHSLLMBHToDateCrush > 0)
                        {
                            BHSLLMBHToDatePerc = Math.Round((BHSLLMBHToDatePerTotal / BHSLLMBHToDateCrush), 2);
                        }

                        //LMOS Chy
                        if (WZLMCHOnDatePerTotal > 0 && WZLMCHOnDateCrush > 0)
                        {
                            WZLMCHOnDatePerc = Math.Round((WZLMCHOnDatePerTotal / WZLMCHOnDateCrush), 2);
                        }
                        if (WZLMCHToDatePerTotal > 0 && WZLMCHToDateCrush > 0)
                        {
                            WZLMCHToDatePerc = Math.Round((WZLMCHToDatePerTotal / WZLMCHToDateCrush), 2);
                        }
                        if (CZLMCHOnDatePerTotal > 0 && CZLMCHOnDateCrush > 0)
                        {
                            CZLMCHOnDatePerc = Math.Round((CZLMCHOnDatePerTotal / CZLMCHOnDateCrush), 2);

                        }
                        if (CZLMCHToDatePerTotal > 0 && CZLMCHToDateCrush > 0)
                        {
                            CZLMCHToDatePerc = Math.Round((CZLMCHToDatePerTotal / CZLMCHToDateCrush), 2);
                        }
                        if (EZLMCHOnDatePerTotal > 0 && EZLMCHOnDateCrush > 0)
                        {
                            EZLMCHOnDatePerc = Math.Round((EZLMCHOnDatePerTotal / EZLMCHOnDateCrush), 2);

                        }
                        if (EZLMCHToDatePerTotal > 0 && EZLMCHToDateCrush > 0)
                        {
                            EZLMCHToDatePerc = Math.Round((EZLMCHToDatePerTotal / EZLMCHToDateCrush), 2);
                        }
                        if (BHSLLMCHOnDatePerTotal > 0 && BHSLLMCHOnDateCrush > 0)
                        {
                            BHSLLMCHOnDatePerc = Math.Round((BHSLLMCHOnDatePerTotal / BHSLLMCHOnDateCrush), 2);
                        }
                        if (BHSLLMCHToDatePerTotal > 0 && BHSLLMCHToDateCrush > 0)
                        {
                            BHSLLMCHToDatePerc = Math.Round((BHSLLMCHToDatePerTotal / BHSLLMCHToDateCrush), 2);
                        }

                        //LMOS B+CHY PERC
                        DataTable LCrushDt = obj1.GetOndateTodateCruch(dt.Rows[a]["F_Code"].ToString(), dates);
                        if (LCrushDt.Rows.Count > 0)
                        {
                            decimal LBCHyOndate = Convert.ToDecimal(LCrushDt.Rows[0]["OndateCrush"].ToString());
                            decimal LBCHyTodate = Convert.ToDecimal(LCrushDt.Rows[0]["TodateCrush"].ToString());

                            BHSLLMBCHOnDatePerTotal = BHSLLMBCHOnDatePerTotal + (LBCHyOndate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_ONDATE"].ToString()));
                            BHSLLMBCHOnDateCrush = BHSLLMBCHOnDateCrush + LBCHyOndate;
                            BHSLLMBCHToDatePerTotal = BHSLLMBCHToDatePerTotal + (LBCHyTodate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_TODATE"].ToString()));
                            BHSLLMBCHToDateCrush = BHSLLMBCHToDateCrush + LBCHyTodate;
                            if (a <= 4)
                            {
                                WZLMBCHOnDatePerTotal = WZLMBCHOnDatePerTotal + (LBCHyOndate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_ONDATE"].ToString()));
                                WZLMBCHOnDateCrush = WZLMBCHOnDateCrush + LBCHyOndate;
                                WZLMBCHToDatePerTotal = WZLMBCHToDatePerTotal + (LBCHyTodate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_TODATE"].ToString()));
                                WZLMBCHToDateCrush = WZLMBCHToDateCrush + LBCHyTodate;
                            }
                            else if (a >= 5 && a <= 9)
                            {
                                CZLMBCHOnDatePerTotal = CZLMBCHOnDatePerTotal + (LBCHyOndate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_ONDATE"].ToString()));
                                CZLMBCHOnDateCrush = CZLMBCHOnDateCrush + LBCHyOndate;
                                CZLMBCHToDatePerTotal = CZLMBCHToDatePerTotal + (LBCHyTodate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_TODATE"].ToString()));
                                CZLMBCHToDateCrush = CZLMBCHToDateCrush + LBCHyTodate;
                            }
                            else if (a >= 9 && a <= 13)
                            {
                                EZLMBCHOnDatePerTotal = EZLMBCHOnDatePerTotal + (LBCHyOndate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_ONDATE"].ToString()));
                                EZLMBCHOnDateCrush = EZLMBCHOnDateCrush + LBCHyOndate;
                                EZLMBCHToDatePerTotal = EZLMBCHToDatePerTotal + (LBCHyTodate * Convert.ToDecimal(dr1["MOL_PERC_BCHY_TODATE"].ToString()));
                                EZLMBCHToDateCrush = EZLMBCHToDateCrush + LBCHyTodate;
                            }
                        }

                        if (WZLMBCHOnDatePerTotal > 0 && WZLMBCHOnDateCrush > 0)
                        {
                            WZLMBCHOnDatePerc = Math.Round((WZLMBCHOnDatePerTotal / WZLMBCHOnDateCrush), 2);
                        }
                        if (WZLMBCHToDatePerTotal > 0 && WZLMBCHToDateCrush > 0)
                        {
                            WZLMBCHToDatePerc = Math.Round((WZLMBCHToDatePerTotal / WZLMBCHToDateCrush), 2);
                        }
                        if (CZLMBCHOnDatePerTotal > 0 && CZLMBCHOnDateCrush > 0)
                        {
                            CZLMBCHOnDatePerc = Math.Round((CZLMBCHOnDatePerTotal / CZLMBCHOnDateCrush), 2);
                        }
                        if (CZLMBCHToDatePerTotal > 0 && CZLMBCHToDateCrush > 0)
                        {
                            CZLMBCHToDatePerc = Math.Round((CZLMBCHToDatePerTotal / CZLMBCHToDateCrush), 2);
                        }
                        if (EZLMBCHOnDatePerTotal > 0 && EZLMBCHOnDateCrush > 0)
                        {
                            EZLMBCHOnDatePerc = Math.Round((EZLMBCHOnDatePerTotal / EZLMBCHOnDateCrush), 2);
                        }
                        if (EZLMBCHToDatePerTotal > 0 && EZLMBCHToDateCrush > 0)
                        {
                            EZLMBCHToDatePerc = Math.Round((EZLMBCHToDatePerTotal / EZLMBCHToDateCrush), 2);
                        }
                        if (BHSLLMBCHOnDatePerTotal > 0 && BHSLLMBCHOnDateCrush > 0)
                        {
                            BHSLLMBCHOnDatePerc = Math.Round((BHSLLMBCHOnDatePerTotal / BHSLLMBCHOnDateCrush), 2);
                        }
                        if (BHSLLMBCHToDatePerTotal > 0 && BHSLLMBCHToDateCrush > 0)
                        {
                            BHSLLMBCHToDatePerc = Math.Round((BHSLLMBCHToDatePerTotal / BHSLLMBCHToDateCrush), 2);
                        }
                        dt1.Rows.Add(dr1);
                        if (a == 4)
                        {
                            decimal CPSYRUP = 0;
                            decimal CPBHY = 0;
                            decimal CPFM = 0;
                            decimal CPTOTAL = 0;
                            decimal ACH_SYRUP = 0;
                            decimal ACH_BHY = 0;
                            decimal ACH_FM = 0;
                            decimal ACHTOTAL = 0;
                            decimal BL_ACH_SYRUP = 0;
                            decimal BL_ACH_BHY = 0;
                            decimal BL_ACH_FM = 0;
                            decimal BLTOTAL = 0;
                            decimal POL_PERC_TARGET = 0;
                            decimal POL_PERC_ONDATE = 0;
                            decimal POL_PERC_TODATE = 0;
                            decimal REC_PERC_TARGET = 0;
                            decimal REC_PERC_ONDATE = 0;
                            decimal REC_PERC_TODATE = 0;
                            decimal SG_PROD_ONDATE = 0;
                            decimal SG_PROD_TODATE = 0;
                            decimal BH_PERC_TARGET = 0;
                            decimal BH_PERC_ONDATE = 0;
                            decimal BH_PERC_TODATE = 0;
                            decimal BH_QTY_ONDATE = 0;
                            decimal BH_QTY_TODATE = 0;
                            decimal CH_PERC_TARGET = 0;
                            decimal CH_PERC_ONDATE = 0;
                            decimal CH_PERC_TODATE = 0;
                            decimal CH_QTY_ONDATE = 0;
                            decimal CH_QTY_TODATE = 0;
                            decimal MOL_PERC_BHY_TARGET = 0;
                            decimal MOL_PERC_BHY_ONDATE = 0;
                            decimal MOL_PERC_BHY_TODATE = 0;
                            decimal MOL_PERC_CHY_TARGET = 0;
                            decimal MOL_PERC_CHY_ONDATE = 0;
                            decimal MOL_PERC_CHY_TODATE = 0;
                            decimal MOL_PERC_BCHY_TARGET = 0;
                            decimal MOL_PERC_BCHY_ONDATE = 0;
                            decimal MOL_PERC_BCHY_TODATE = 0;
                            decimal STCANE_PERC_TARGET = 0;
                            decimal STCANE_PERC_ONDATE = 0;
                            decimal STCANE_PERC_TODATE = 0;
                            decimal BAGASE_PERC_TARGET = 0;
                            decimal BAGASE_PERC_ONDATE = 0;
                            decimal BAGASE_PERC_TODATE = 0;
                            decimal BAGASE_QTY_ONDATE = 0;
                            decimal BAGASE_QTY_TODATE = 0;
                            // decimal ALHL_SYRUP_TARGET = 0;
                            //decimal ALHL_SYRUP_ONDATE = 0;
                            // decimal ALHL_SYRUP_TODATE = 0;
                            // decimal ALHL_BH_TARGET = 0;
                            //decimal ALHL_BH_ONDATE = 0;
                            // decimal ALHL_BH_TODATE = 0;
                            //decimal ALHL_CH_TARGET = 0;
                            //decimal ALHL_CH_ONDATE = 0;
                            // decimal ALHL_CH_TODATE = 0;
                            decimal ALHL_TOTAL_TARGET = 0;
                            decimal ALHL_TOTAL_ONDATE = 0;
                            decimal ALHL_TOTAL_TODATE = 0;
                            decimal POWER_PRODUCED_TARGET = 0;
                            decimal POWER_PRODUCED_ONDATE = 0;
                            decimal POWER_PRODUCED_TODATE = 0;
                            decimal POWER_EXPORT_TARGET = 0;
                            decimal POWER_EXPORT_ONDATE = 0;
                            decimal POWER_EXPORT_TODATE = 0;



                            for (int w = 0; w < dt1.Rows.Count; w++)
                            {
                                CPSYRUP += Convert.ToDecimal(dt1.Rows[w]["CPSYRUP"].ToString());
                                CPBHY += Convert.ToDecimal(dt1.Rows[w]["CPBHY"].ToString());
                                CPFM += Convert.ToDecimal(dt1.Rows[w]["CPFM"].ToString());
                                CPTOTAL += Convert.ToDecimal(dt1.Rows[w]["CPTOTAL"].ToString());
                                ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["ACH_SYRUP"].ToString());
                                ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["ACH_BHY"].ToString());
                                ACH_FM += Convert.ToDecimal(dt1.Rows[w]["ACH_FM"].ToString());
                                ACHTOTAL += Convert.ToDecimal(dt1.Rows[w]["ACHTOTAL"].ToString());
                                BL_ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_SYRUP"].ToString());
                                BL_ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_BHY"].ToString());
                                BL_ACH_FM += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_FM"].ToString());
                                BLTOTAL += Convert.ToDecimal(dt1.Rows[w]["BLTOTAL"].ToString());
                                POL_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TARGET"].ToString());
                                POL_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_ONDATE"].ToString());
                                POL_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TODATE"].ToString());
                                REC_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TARGET"].ToString());
                                REC_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_ONDATE"].ToString());
                                REC_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TODATE"].ToString());
                                SG_PROD_ONDATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_ONDATE"].ToString());
                                SG_PROD_TODATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_TODATE"].ToString());
                                BH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TARGET"].ToString());
                                BH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_ONDATE"].ToString());
                                BH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TODATE"].ToString());
                                BH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_ONDATE"].ToString());
                                BH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_TODATE"].ToString());

                                CH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TARGET"].ToString());
                                CH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_ONDATE"].ToString());
                                CH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TODATE"].ToString());
                                CH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_ONDATE"].ToString());
                                CH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_TODATE"].ToString());

                                MOL_PERC_BHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TARGET"].ToString());
                                MOL_PERC_BHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_ONDATE"].ToString());
                                MOL_PERC_BHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TODATE"].ToString());
                                MOL_PERC_CHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TARGET"].ToString());
                                MOL_PERC_CHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_ONDATE"].ToString());
                                MOL_PERC_CHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TODATE"].ToString());
                                MOL_PERC_BCHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TARGET"].ToString());
                                MOL_PERC_BCHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_ONDATE"].ToString());
                                MOL_PERC_BCHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TODATE"].ToString());
                                STCANE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TARGET"].ToString());
                                STCANE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_ONDATE"].ToString());
                                STCANE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TODATE"].ToString());
                                BAGASE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TARGET"].ToString());
                                BAGASE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_ONDATE"].ToString());
                                BAGASE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TODATE"].ToString());
                                BAGASE_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_ONDATE"].ToString());
                                BAGASE_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_TODATE"].ToString());

                                // ALHL_SYRUP_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TARGET"].ToString());
                                // ALHL_SYRUP_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_ONDATE"].ToString());
                                // ALHL_SYRUP_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TODATE"].ToString());
                                // ALHL_BH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TARGET"].ToString());
                                //  ALHL_BH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_ONDATE"].ToString());
                                // ALHL_BH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TODATE"].ToString());
                                //ALHL_CH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TARGET"].ToString());
                                // ALHL_CH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_ONDATE"].ToString());
                                // ALHL_CH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TODATE"].ToString());

                                ALHL_TOTAL_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TARGET"].ToString());
                                ALHL_TOTAL_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_ONDATE"].ToString());
                                ALHL_TOTAL_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TODATE"].ToString());

                                POWER_PRODUCED_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TARGET"].ToString());
                                POWER_PRODUCED_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_ONDATE"].ToString());
                                POWER_PRODUCED_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TODATE"].ToString());
                                POWER_EXPORT_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TARGET"].ToString());
                                POWER_EXPORT_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_ONDATE"].ToString());
                                POWER_EXPORT_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TODATE"].ToString());

                            }
                            dr1 = dt1.NewRow();
                            dr1["FACTORY"] = "WZ";
                            dr1["CPSYRUP"] = CPSYRUP.ToString();
                            dr1["CPBHY"] = CPBHY.ToString();
                            dr1["CPFM"] = CPFM.ToString();
                            dr1["CPTOTAL"] = CPTOTAL.ToString();
                            dr1["ACH_SYRUP"] = ACH_SYRUP.ToString();
                            dr1["ACH_BHY"] = ACH_BHY.ToString();
                            dr1["ACH_FM"] = ACH_FM.ToString();
                            dr1["ACHTOTAL"] = ACHTOTAL.ToString();
                            dr1["BL_ACH_SYRUP"] = BL_ACH_SYRUP.ToString();
                            dr1["BL_ACH_BHY"] = BL_ACH_BHY.ToString();
                            dr1["BL_ACH_FM"] = BL_ACH_FM.ToString();
                            dr1["BLTOTAL"] = BLTOTAL.ToString();
                            dr1["POL_PERC_TARGET"] = "0"; // POL_PERC_TARGET.ToString();
                            dr1["POL_PERC_ONDATE"] = WZPolOnDatePerc.ToString(); // POL_PERC_ONDATE.ToString();
                            dr1["POL_PERC_TODATE"] = WZPolToDatePerc.ToString(); // POL_PERC_TODATE.ToString();
                            dr1["REC_PERC_TARGET"] = "0"; // REC_PERC_TARGET.ToString();
                            dr1["REC_PERC_ONDATE"] = WZprcpreondate.ToString();  // REC_PERC_ONDATE.ToString();
                            dr1["REC_PERC_TODATE"] = WZRecPercToDate.ToString(); // REC_PERC_TODATE.ToString();
                            dr1["SG_PROD_ONDATE"] = SG_PROD_ONDATE.ToString();
                            dr1["SG_PROD_TODATE"] = SG_PROD_TODATE.ToString();
                            dr1["BH_PERC_TARGET"] = "0"; // BH_PERC_TARGET.ToString();
                            dr1["BH_PERC_ONDATE"] = WZBHOnDatePerc.ToString(); // BH_PERC_ONDATE.ToString();
                            dr1["BH_PERC_TODATE"] = WZBHToDatePerc.ToString(); // BH_PERC_TODATE.ToString();
                            dr1["BH_QTY_ONDATE"] = BH_QTY_ONDATE.ToString();
                            dr1["BH_QTY_TODATE"] = BH_QTY_TODATE.ToString();

                            dr1["CH_PERC_TARGET"] = "0"; // CH_PERC_TARGET.ToString();
                            dr1["CH_PERC_ONDATE"] = WZCHOnDatePerc.ToString(); // CH_PERC_ONDATE.ToString();
                            dr1["CH_QTY_TODATE"] = CH_QTY_TODATE.ToString();
                            dr1["CH_QTY_ONDATE"] = CH_QTY_ONDATE.ToString();

                            dr1["CH_PERC_TODATE"] = WZCHToDatePerc.ToString(); // CH_PERC_TODATE.ToString();
                            dr1["MOL_PERC_BHY_TARGET"] = "0"; // MOL_PERC_BHY_TARGET.ToString();
                            dr1["MOL_PERC_BHY_ONDATE"] = WZLMBHOnDatePerc.ToString(); // MOL_PERC_BHY_ONDATE.ToString();
                            dr1["MOL_PERC_BHY_TODATE"] = WZLMBHToDatePerc.ToString(); // MOL_PERC_BHY_TODATE.ToString();
                            dr1["MOL_PERC_CHY_TARGET"] = "0"; // MOL_PERC_CHY_TARGET.ToString();
                            dr1["MOL_PERC_CHY_ONDATE"] = WZLMCHOnDatePerc.ToString(); // MOL_PERC_CHY_ONDATE.ToString();
                            dr1["MOL_PERC_CHY_TODATE"] = WZLMCHToDatePerc.ToString(); // MOL_PERC_CHY_TODATE.ToString();
                            dr1["MOL_PERC_BCHY_TARGET"] = "0"; // MOL_PERC_BCHY_TARGET.ToString();
                            dr1["MOL_PERC_BCHY_ONDATE"] = WZLMBCHOnDatePerc.ToString(); // MOL_PERC_BCHY_ONDATE.ToString();
                            dr1["MOL_PERC_BCHY_TODATE"] = WZLMBCHToDatePerc.ToString(); // MOL_PERC_BCHY_TODATE.ToString();
                            dr1["STCANE_PERC_TARGET"] = "0"; // STCANE_PERC_TARGET.ToString();
                            dr1["STCANE_PERC_ONDATE"] = WZSTOnDatePerc.ToString(); // STCANE_PERC_ONDATE.ToString();
                            dr1["STCANE_PERC_TODATE"] = WZSTToDatePerc.ToString(); // STCANE_PERC_TODATE.ToString();
                            dr1["BAGASE_PERC_TARGET"] = "0"; // BAGASE_PERC_TARGET.ToString();
                            dr1["BAGASE_PERC_ONDATE"] = WZBGOnDatePerc.ToString(); // BAGASE_PERC_ONDATE.ToString();
                            dr1["BAGASE_PERC_TODATE"] = WZBGToDatePerc.ToString();// BAGASE_PERC_TODATE.ToString();
                            dr1["BAGASE_QTY_ONDATE"] = BAGASE_QTY_ONDATE.ToString();
                            dr1["BAGASE_QTY_TODATE"] = BAGASE_QTY_TODATE.ToString();

                            // dr1["ALHL_SYRUP_TARGET"] = ALHL_SYRUP_TARGET.ToString();
                            //dr1["ALHL_SYRUP_ONDATE"] = ALHL_SYRUP_ONDATE.ToString();
                            //dr1["ALHL_SYRUP_TODATE"] = ALHL_SYRUP_TODATE.ToString();
                            // dr1["ALHL_BH_TARGET"] = ALHL_BH_TARGET.ToString();
                            // dr1["ALHL_BH_ONDATE"] = ALHL_BH_ONDATE.ToString();
                            // dr1["ALHL_BH_TODATE"] = ALHL_BH_TODATE.ToString();
                            //dr1["ALHL_CH_TARGET"] = ALHL_CH_TARGET.ToString();
                            // dr1["ALHL_CH_ONDATE"] = ALHL_CH_ONDATE.ToString();
                            // dr1["ALHL_CH_TODATE"] = ALHL_CH_TODATE.ToString();
                            dr1["ALHL_TOTAL_TARGET"] = ALHL_TOTAL_TARGET.ToString();
                            dr1["ALHL_TOTAL_ONDATE"] = ALHL_TOTAL_ONDATE.ToString();
                            dr1["ALHL_TOTAL_TODATE"] = ALHL_TOTAL_TODATE.ToString();

                            dr1["POWER_PRODUCED_TARGET"] = POWER_PRODUCED_TARGET.ToString();
                            dr1["POWER_PRODUCED_ONDATE"] = POWER_PRODUCED_ONDATE.ToString();
                            dr1["POWER_PRODUCED_TODATE"] = POWER_PRODUCED_TODATE.ToString();
                            dr1["POWER_EXPORT_TARGET"] = POWER_EXPORT_TARGET.ToString();
                            dr1["POWER_EXPORT_ONDATE"] = POWER_EXPORT_ONDATE.ToString();
                            dr1["POWER_EXPORT_TODATE"] = POWER_EXPORT_TODATE.ToString();
                            dt1.Rows.Add(dr1);
                        }
                        if (a == 9)
                        {
                            decimal CPSYRUP = 0;
                            decimal CPBHY = 0;
                            decimal CPFM = 0;
                            decimal CPTOTAL = 0;
                            decimal ACH_SYRUP = 0;
                            decimal ACH_BHY = 0;
                            decimal ACH_FM = 0;
                            decimal ACHTOTAL = 0;
                            decimal BL_ACH_SYRUP = 0;
                            decimal BL_ACH_BHY = 0;
                            decimal BL_ACH_FM = 0;
                            decimal BLTOTAL = 0;
                            decimal POL_PERC_TARGET = 0;
                            decimal POL_PERC_ONDATE = 0;
                            decimal POL_PERC_TODATE = 0;
                            decimal REC_PERC_TARGET = 0;
                            decimal REC_PERC_ONDATE = 0;
                            decimal REC_PERC_TODATE = 0;
                            decimal SG_PROD_ONDATE = 0;
                            decimal SG_PROD_TODATE = 0;
                            decimal BH_PERC_TARGET = 0;
                            decimal BH_PERC_ONDATE = 0;
                            decimal BH_PERC_TODATE = 0;
                            decimal BH_QTY_ONDATE = 0;
                            decimal BH_QTY_TODATE = 0;

                            decimal CH_PERC_TARGET = 0;
                            decimal CH_PERC_ONDATE = 0;
                            decimal CH_PERC_TODATE = 0;
                            decimal CH_QTY_ONDATE = 0;
                            decimal CH_QTY_TODATE = 0;

                            decimal MOL_PERC_BHY_TARGET = 0;
                            decimal MOL_PERC_BHY_ONDATE = 0;
                            decimal MOL_PERC_BHY_TODATE = 0;
                            decimal MOL_PERC_CHY_TARGET = 0;
                            decimal MOL_PERC_CHY_ONDATE = 0;
                            decimal MOL_PERC_CHY_TODATE = 0;
                            decimal MOL_PERC_BCHY_TARGET = 0;
                            decimal MOL_PERC_BCHY_ONDATE = 0;
                            decimal MOL_PERC_BCHY_TODATE = 0;
                            decimal STCANE_PERC_TARGET = 0;
                            decimal STCANE_PERC_ONDATE = 0;
                            decimal STCANE_PERC_TODATE = 0;
                            decimal BAGASE_PERC_TARGET = 0;
                            decimal BAGASE_PERC_ONDATE = 0;
                            decimal BAGASE_PERC_TODATE = 0;
                            decimal BAGASE_QTY_ONDATE = 0;
                            decimal BAGASE_QTY_TODATE = 0;

                            //decimal ALHL_SYRUP_TARGET = 0;
                            // decimal ALHL_SYRUP_ONDATE = 0;
                            //decimal ALHL_SYRUP_TODATE = 0;
                            // decimal ALHL_BH_TARGET = 0;
                            // decimal ALHL_BH_ONDATE = 0;
                            // decimal ALHL_BH_TODATE = 0;
                            // decimal ALHL_CH_TARGET = 0;
                            //  decimal ALHL_CH_ONDATE = 0;
                            // decimal ALHL_CH_TODATE = 0;
                            decimal ALHL_TOTAL_TARGET = 0;
                            decimal ALHL_TOTAL_ONDATE = 0;
                            decimal ALHL_TOTAL_TODATE = 0;

                            decimal POWER_PRODUCED_TARGET = 0;
                            decimal POWER_PRODUCED_ONDATE = 0;
                            decimal POWER_PRODUCED_TODATE = 0;
                            decimal POWER_EXPORT_TARGET = 0;
                            decimal POWER_EXPORT_ONDATE = 0;
                            decimal POWER_EXPORT_TODATE = 0;

                            for (int w = 0; w < dt1.Rows.Count; w++)
                            {
                                if (w > 5)
                                {
                                    CPSYRUP += Convert.ToDecimal(dt1.Rows[w]["CPSYRUP"].ToString());
                                    CPBHY += Convert.ToDecimal(dt1.Rows[w]["CPBHY"].ToString());
                                    CPFM += Convert.ToDecimal(dt1.Rows[w]["CPFM"].ToString());
                                    CPTOTAL += Convert.ToDecimal(dt1.Rows[w]["CPTOTAL"].ToString());
                                    ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["ACH_SYRUP"].ToString());
                                    ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["ACH_BHY"].ToString());
                                    ACH_FM += Convert.ToDecimal(dt1.Rows[w]["ACH_FM"].ToString());
                                    ACHTOTAL += Convert.ToDecimal(dt1.Rows[w]["ACHTOTAL"].ToString());
                                    BL_ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_SYRUP"].ToString());
                                    BL_ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_BHY"].ToString());
                                    BL_ACH_FM += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_FM"].ToString());
                                    BLTOTAL += Convert.ToDecimal(dt1.Rows[w]["BLTOTAL"].ToString());
                                    POL_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TARGET"].ToString());
                                    POL_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_ONDATE"].ToString());
                                    POL_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TODATE"].ToString());
                                    REC_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TARGET"].ToString());
                                    REC_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_ONDATE"].ToString());
                                    REC_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TODATE"].ToString());
                                    SG_PROD_ONDATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_ONDATE"].ToString());
                                    SG_PROD_TODATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_TODATE"].ToString());
                                    BH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TARGET"].ToString());
                                    BH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_ONDATE"].ToString());
                                    BH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TODATE"].ToString());
                                    BH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_ONDATE"].ToString());
                                    BH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_TODATE"].ToString());

                                    CH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TARGET"].ToString());
                                    CH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_ONDATE"].ToString());
                                    CH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TODATE"].ToString());
                                    CH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_ONDATE"].ToString());
                                    CH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_TODATE"].ToString());

                                    MOL_PERC_BHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TARGET"].ToString());
                                    MOL_PERC_BHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_ONDATE"].ToString());
                                    MOL_PERC_BHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TODATE"].ToString());
                                    MOL_PERC_CHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TARGET"].ToString());
                                    MOL_PERC_CHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_ONDATE"].ToString());
                                    MOL_PERC_CHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TODATE"].ToString());
                                    MOL_PERC_BCHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TARGET"].ToString());
                                    MOL_PERC_BCHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_ONDATE"].ToString());
                                    MOL_PERC_BCHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TODATE"].ToString());
                                    STCANE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TARGET"].ToString());
                                    STCANE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_ONDATE"].ToString());
                                    STCANE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TODATE"].ToString());
                                    BAGASE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TARGET"].ToString());
                                    BAGASE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_ONDATE"].ToString());
                                    BAGASE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TODATE"].ToString());
                                    BAGASE_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_ONDATE"].ToString());
                                    BAGASE_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_TODATE"].ToString());

                                    // ALHL_SYRUP_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TARGET"].ToString());
                                    //ALHL_SYRUP_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_ONDATE"].ToString());
                                    // ALHL_SYRUP_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TODATE"].ToString());
                                    //ALHL_BH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TARGET"].ToString());
                                    // ALHL_BH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_ONDATE"].ToString());
                                    // ALHL_BH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TODATE"].ToString());
                                    //ALHL_CH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TARGET"].ToString());
                                    // ALHL_CH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_ONDATE"].ToString());
                                    //ALHL_CH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TODATE"].ToString());
                                    ALHL_TOTAL_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TARGET"].ToString());
                                    ALHL_TOTAL_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_ONDATE"].ToString());
                                    ALHL_TOTAL_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TODATE"].ToString());

                                    POWER_PRODUCED_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TARGET"].ToString());
                                    POWER_PRODUCED_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_ONDATE"].ToString());
                                    POWER_PRODUCED_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TODATE"].ToString());
                                    POWER_EXPORT_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TARGET"].ToString());
                                    POWER_EXPORT_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_ONDATE"].ToString());
                                    POWER_EXPORT_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TODATE"].ToString());

                                }
                            }
                            dr1 = dt1.NewRow();
                            dr1["FACTORY"] = "CZ";
                            dr1["CPSYRUP"] = CPSYRUP.ToString();
                            dr1["CPBHY"] = CPBHY.ToString();
                            dr1["CPFM"] = CPFM.ToString();
                            dr1["CPTOTAL"] = CPTOTAL.ToString();
                            dr1["ACH_SYRUP"] = ACH_SYRUP.ToString();
                            dr1["ACH_BHY"] = ACH_BHY.ToString();
                            dr1["ACH_FM"] = ACH_FM.ToString();
                            dr1["ACHTOTAL"] = ACHTOTAL.ToString();
                            dr1["BL_ACH_SYRUP"] = BL_ACH_SYRUP.ToString();
                            dr1["BL_ACH_BHY"] = BL_ACH_BHY.ToString();
                            dr1["BL_ACH_FM"] = BL_ACH_FM.ToString();
                            dr1["BLTOTAL"] = BLTOTAL.ToString();
                            dr1["POL_PERC_TARGET"] = "0"; // POL_PERC_TARGET.ToString();
                            dr1["POL_PERC_ONDATE"] = CZPolOnDatePerc.ToString(); ; // POL_PERC_ONDATE.ToString();
                            dr1["POL_PERC_TODATE"] = CZPolToDatePerc.ToString(); // POL_PERC_TODATE.ToString();
                            dr1["REC_PERC_TARGET"] = "0"; // REC_PERC_TARGET.ToString();
                            dr1["REC_PERC_ONDATE"] = CZprcpreondate.ToString(); // REC_PERC_ONDATE.ToString();
                            dr1["REC_PERC_TODATE"] = CZRecPercToDate.ToString(); // REC_PERC_TODATE.ToString();
                            dr1["SG_PROD_ONDATE"] = SG_PROD_ONDATE.ToString();
                            dr1["SG_PROD_TODATE"] = SG_PROD_TODATE.ToString();
                            dr1["BH_PERC_TARGET"] = "0"; // BH_PERC_TARGET.ToString();
                            dr1["BH_PERC_ONDATE"] = CZBHOnDatePerc.ToString(); // BH_PERC_ONDATE.ToString();
                            dr1["BH_PERC_TODATE"] = CZBHToDatePerc.ToString();// BH_PERC_TODATE.ToString();
                            dr1["BH_QTY_ONDATE"] = BH_QTY_ONDATE.ToString();
                            dr1["BH_QTY_TODATE"] = BH_QTY_TODATE.ToString();

                            dr1["CH_PERC_TARGET"] = "0"; // CH_PERC_TARGET.ToString();
                            dr1["CH_PERC_ONDATE"] = CZCHOnDatePerc.ToString(); // CH_PERC_ONDATE.ToString();
                            dr1["CH_PERC_TODATE"] = CZCHToDatePerc.ToString(); // CH_PERC_TODATE.ToString();
                            dr1["CH_QTY_ONDATE"] = CH_QTY_ONDATE.ToString();
                            dr1["CH_QTY_TODATE"] = CH_QTY_TODATE.ToString();

                            dr1["MOL_PERC_BHY_TARGET"] = "0"; // MOL_PERC_BHY_TARGET.ToString();
                            dr1["MOL_PERC_BHY_ONDATE"] = CZLMBHOnDatePerc.ToString(); // MOL_PERC_BHY_ONDATE.ToString();
                            dr1["MOL_PERC_BHY_TODATE"] = CZLMBHToDatePerc.ToString(); // MOL_PERC_BHY_TODATE.ToString();
                            dr1["MOL_PERC_CHY_TARGET"] = "0"; // MOL_PERC_CHY_TARGET.ToString();
                            dr1["MOL_PERC_CHY_ONDATE"] = CZLMCHOnDatePerc.ToString(); // MOL_PERC_CHY_ONDATE.ToString();
                            dr1["MOL_PERC_CHY_TODATE"] = CZLMCHToDatePerc.ToString(); // MOL_PERC_CHY_TODATE.ToString();
                            dr1["MOL_PERC_BCHY_TARGET"] = "0"; // MOL_PERC_BCHY_TARGET.ToString();
                            dr1["MOL_PERC_BCHY_ONDATE"] = CZLMBCHOnDatePerc.ToString(); // MOL_PERC_BCHY_ONDATE.ToString();
                            dr1["MOL_PERC_BCHY_TODATE"] = CZLMBCHToDatePerc.ToString(); // MOL_PERC_BCHY_TODATE.ToString();
                            dr1["STCANE_PERC_TARGET"] = "0"; // STCANE_PERC_TARGET.ToString();
                            dr1["STCANE_PERC_ONDATE"] = CZSTOnDatePerc.ToString(); // STCANE_PERC_ONDATE.ToString();
                            dr1["STCANE_PERC_TODATE"] = CZSTToDatePerc.ToString(); // STCANE_PERC_TODATE.ToString();
                            dr1["BAGASE_PERC_TARGET"] = "0"; // BAGASE_PERC_TARGET.ToString();
                            dr1["BAGASE_PERC_ONDATE"] = CZBGOnDatePerc.ToString(); // BAGASE_PERC_ONDATE.ToString();
                            dr1["BAGASE_PERC_TODATE"] = CZBGToDatePerc.ToString(); // BAGASE_PERC_TODATE.ToString();
                            dr1["BAGASE_QTY_ONDATE"] = BAGASE_QTY_ONDATE.ToString();
                            dr1["BAGASE_QTY_TODATE"] = BAGASE_QTY_TODATE.ToString();

                            //dr1["ALHL_SYRUP_TARGET"] = ALHL_SYRUP_TARGET.ToString();
                            //dr1["ALHL_SYRUP_ONDATE"] = ALHL_SYRUP_ONDATE.ToString();
                            // dr1["ALHL_SYRUP_TODATE"] = ALHL_SYRUP_TODATE.ToString();
                            // dr1["ALHL_BH_TARGET"] = ALHL_BH_TARGET.ToString();
                            // dr1["ALHL_BH_ONDATE"] = ALHL_BH_ONDATE.ToString();
                            //dr1["ALHL_BH_TODATE"] = ALHL_BH_TODATE.ToString();
                            //dr1["ALHL_CH_TARGET"] = ALHL_CH_TARGET.ToString();
                            //dr1["ALHL_CH_ONDATE"] = ALHL_CH_ONDATE.ToString();
                            // dr1["ALHL_CH_TODATE"] = ALHL_CH_TODATE.ToString();
                            dr1["ALHL_TOTAL_TARGET"] = ALHL_TOTAL_TARGET.ToString();
                            dr1["ALHL_TOTAL_ONDATE"] = ALHL_TOTAL_ONDATE.ToString();
                            dr1["ALHL_TOTAL_TODATE"] = ALHL_TOTAL_TODATE.ToString();

                            dr1["POWER_PRODUCED_TARGET"] = POWER_PRODUCED_TARGET.ToString();
                            dr1["POWER_PRODUCED_ONDATE"] = POWER_PRODUCED_ONDATE.ToString();
                            dr1["POWER_PRODUCED_TODATE"] = POWER_PRODUCED_TODATE.ToString();
                            dr1["POWER_EXPORT_TARGET"] = POWER_EXPORT_TARGET.ToString();
                            dr1["POWER_EXPORT_ONDATE"] = POWER_EXPORT_ONDATE.ToString();
                            dr1["POWER_EXPORT_TODATE"] = POWER_EXPORT_TODATE.ToString();
                            dt1.Rows.Add(dr1);
                        }
                        if (a == 13)
                        {
                            decimal CPSYRUP = 0;
                            decimal CPBHY = 0;
                            decimal CPFM = 0;
                            decimal CPTOTAL = 0;
                            decimal ACH_SYRUP = 0;
                            decimal ACH_BHY = 0;
                            decimal ACH_FM = 0;
                            decimal ACHTOTAL = 0;
                            decimal BL_ACH_SYRUP = 0;
                            decimal BL_ACH_BHY = 0;
                            decimal BL_ACH_FM = 0;
                            decimal BLTOTAL = 0;
                            decimal POL_PERC_TARGET = 0;
                            decimal POL_PERC_ONDATE = 0;
                            decimal POL_PERC_TODATE = 0;
                            decimal REC_PERC_TARGET = 0;
                            decimal REC_PERC_ONDATE = 0;
                            decimal REC_PERC_TODATE = 0;
                            decimal SG_PROD_ONDATE = 0;
                            decimal SG_PROD_TODATE = 0;
                            decimal BH_PERC_TARGET = 0;
                            decimal BH_PERC_ONDATE = 0;
                            decimal BH_PERC_TODATE = 0;
                            decimal BH_QTY_ONDATE = 0;
                            decimal BH_QTY_TODATE = 0;

                            decimal CH_PERC_TARGET = 0;
                            decimal CH_PERC_ONDATE = 0;
                            decimal CH_PERC_TODATE = 0;
                            decimal CH_QTY_ONDATE = 0;
                            decimal CH_QTY_TODATE = 0;

                            decimal MOL_PERC_BHY_TARGET = 0;
                            decimal MOL_PERC_BHY_ONDATE = 0;
                            decimal MOL_PERC_BHY_TODATE = 0;
                            decimal MOL_PERC_CHY_TARGET = 0;
                            decimal MOL_PERC_CHY_ONDATE = 0;
                            decimal MOL_PERC_CHY_TODATE = 0;
                            decimal MOL_PERC_BCHY_TARGET = 0;
                            decimal MOL_PERC_BCHY_ONDATE = 0;
                            decimal MOL_PERC_BCHY_TODATE = 0;
                            decimal STCANE_PERC_TARGET = 0;
                            decimal STCANE_PERC_ONDATE = 0;
                            decimal STCANE_PERC_TODATE = 0;
                            decimal BAGASE_PERC_TARGET = 0;
                            decimal BAGASE_PERC_ONDATE = 0;
                            decimal BAGASE_PERC_TODATE = 0;
                            decimal BAGASE_QTY_ONDATE = 0;
                            decimal BAGASE_QTY_TODATE = 0;

                            //decimal ALHL_SYRUP_TARGET = 0;
                            //decimal ALHL_SYRUP_ONDATE = 0;
                            // decimal ALHL_SYRUP_TODATE = 0;
                            //decimal ALHL_BH_TARGET = 0;
                            //decimal ALHL_BH_ONDATE = 0;
                            // decimal ALHL_BH_TODATE = 0;
                            //decimal ALHL_CH_TARGET = 0;
                            // decimal ALHL_CH_ONDATE = 0;
                            // decimal ALHL_CH_TODATE = 0;
                            decimal ALHL_TOTAL_TARGET = 0;
                            decimal ALHL_TOTAL_ONDATE = 0;
                            decimal ALHL_TOTAL_TODATE = 0;

                            decimal POWER_PRODUCED_TARGET = 0;
                            decimal POWER_PRODUCED_ONDATE = 0;
                            decimal POWER_PRODUCED_TODATE = 0;
                            decimal POWER_EXPORT_TARGET = 0;
                            decimal POWER_EXPORT_ONDATE = 0;
                            decimal POWER_EXPORT_TODATE = 0;

                            for (int w = 0; w < dt1.Rows.Count; w++)
                            {
                                if (w > 11)
                                {
                                    CPSYRUP += Convert.ToDecimal(dt1.Rows[w]["CPSYRUP"].ToString());
                                    CPBHY += Convert.ToDecimal(dt1.Rows[w]["CPBHY"].ToString());
                                    CPFM += Convert.ToDecimal(dt1.Rows[w]["CPFM"].ToString());
                                    CPTOTAL += Convert.ToDecimal(dt1.Rows[w]["CPTOTAL"].ToString());
                                    ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["ACH_SYRUP"].ToString());
                                    ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["ACH_BHY"].ToString());
                                    ACH_FM += Convert.ToDecimal(dt1.Rows[w]["ACH_FM"].ToString());
                                    ACHTOTAL += Convert.ToDecimal(dt1.Rows[w]["ACHTOTAL"].ToString());
                                    BL_ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_SYRUP"].ToString());
                                    BL_ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_BHY"].ToString());
                                    BL_ACH_FM += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_FM"].ToString());
                                    BLTOTAL += Convert.ToDecimal(dt1.Rows[w]["BLTOTAL"].ToString());
                                    POL_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TARGET"].ToString());
                                    POL_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_ONDATE"].ToString());
                                    POL_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TODATE"].ToString());
                                    REC_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TARGET"].ToString());
                                    REC_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_ONDATE"].ToString());
                                    REC_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TODATE"].ToString());
                                    SG_PROD_ONDATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_ONDATE"].ToString());
                                    SG_PROD_TODATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_TODATE"].ToString());
                                    BH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TARGET"].ToString());
                                    BH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_ONDATE"].ToString());
                                    BH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TODATE"].ToString());
                                    BH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_ONDATE"].ToString());
                                    BH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_TODATE"].ToString());

                                    CH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TARGET"].ToString());
                                    CH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_ONDATE"].ToString());
                                    CH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TODATE"].ToString());
                                    CH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_ONDATE"].ToString());
                                    CH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_TODATE"].ToString());

                                    MOL_PERC_BHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TARGET"].ToString());
                                    MOL_PERC_BHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_ONDATE"].ToString());
                                    MOL_PERC_BHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TODATE"].ToString());
                                    MOL_PERC_CHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TARGET"].ToString());
                                    MOL_PERC_CHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_ONDATE"].ToString());
                                    MOL_PERC_CHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TODATE"].ToString());
                                    MOL_PERC_BCHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TARGET"].ToString());
                                    MOL_PERC_BCHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_ONDATE"].ToString());
                                    MOL_PERC_BCHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TODATE"].ToString());
                                    STCANE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TARGET"].ToString());
                                    STCANE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_ONDATE"].ToString());
                                    STCANE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TODATE"].ToString());
                                    BAGASE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TARGET"].ToString());
                                    BAGASE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_ONDATE"].ToString());
                                    BAGASE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TODATE"].ToString());
                                    BAGASE_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_ONDATE"].ToString());
                                    BAGASE_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_TODATE"].ToString());

                                    //ALHL_SYRUP_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TARGET"].ToString());
                                    // ALHL_SYRUP_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_ONDATE"].ToString());
                                    // ALHL_SYRUP_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TODATE"].ToString());
                                    //ALHL_BH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TARGET"].ToString());
                                    // ALHL_BH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_ONDATE"].ToString());
                                    //ALHL_BH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TODATE"].ToString());
                                    //ALHL_CH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TARGET"].ToString());
                                    // ALHL_CH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_ONDATE"].ToString());
                                    // ALHL_CH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TODATE"].ToString());
                                    ALHL_TOTAL_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TARGET"].ToString());
                                    ALHL_TOTAL_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_ONDATE"].ToString());
                                    ALHL_TOTAL_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TODATE"].ToString());

                                    POWER_PRODUCED_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TARGET"].ToString());
                                    POWER_PRODUCED_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_ONDATE"].ToString());
                                    POWER_PRODUCED_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TODATE"].ToString());
                                    POWER_EXPORT_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TARGET"].ToString());
                                    POWER_EXPORT_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_ONDATE"].ToString());
                                    POWER_EXPORT_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TODATE"].ToString());
                                }
                            }
                            dr1 = dt1.NewRow();
                            dr1["FACTORY"] = "EZ";
                            dr1["CPSYRUP"] = CPSYRUP.ToString();
                            dr1["CPBHY"] = CPBHY.ToString();
                            dr1["CPFM"] = CPFM.ToString();
                            dr1["CPTOTAL"] = CPTOTAL.ToString();
                            dr1["ACH_SYRUP"] = ACH_SYRUP.ToString();
                            dr1["ACH_BHY"] = ACH_BHY.ToString();
                            dr1["ACH_FM"] = ACH_FM.ToString();
                            dr1["ACHTOTAL"] = ACHTOTAL.ToString();
                            dr1["BL_ACH_SYRUP"] = BL_ACH_SYRUP.ToString();
                            dr1["BL_ACH_BHY"] = BL_ACH_BHY.ToString();
                            dr1["BL_ACH_FM"] = BL_ACH_FM.ToString();
                            dr1["BLTOTAL"] = BLTOTAL.ToString();
                            dr1["POL_PERC_TARGET"] = "0"; // POL_PERC_TARGET.ToString();
                            dr1["POL_PERC_ONDATE"] = EZPolOnDatePerc.ToString(); // POL_PERC_ONDATE.ToString();
                            dr1["POL_PERC_TODATE"] = EZPolToDatePerc.ToString(); // POL_PERC_TODATE.ToString();
                            dr1["REC_PERC_TARGET"] = "0"; // REC_PERC_TARGET.ToString();
                            dr1["REC_PERC_ONDATE"] = EZprcpreondate.ToString(); // REC_PERC_ONDATE.ToString();
                            dr1["REC_PERC_TODATE"] = EZRecPercToDate.ToString(); // REC_PERC_TODATE.ToString();
                            dr1["SG_PROD_ONDATE"] = SG_PROD_ONDATE.ToString();
                            dr1["SG_PROD_TODATE"] = SG_PROD_TODATE.ToString();
                            dr1["BH_PERC_TARGET"] = "0"; // BH_PERC_TARGET.ToString();
                            dr1["BH_PERC_ONDATE"] = EZBHOnDatePerc.ToString(); // BH_PERC_ONDATE.ToString();
                            dr1["BH_PERC_TODATE"] = EZBHToDatePerc.ToString(); // BH_PERC_TODATE.ToString();
                            dr1["BH_QTY_ONDATE"] = BH_QTY_ONDATE.ToString();
                            dr1["BH_QTY_TODATE"] = BH_QTY_TODATE.ToString();

                            dr1["CH_PERC_TARGET"] = "0"; // CH_PERC_TARGET.ToString();
                            dr1["CH_PERC_ONDATE"] = EZCHOnDatePerc.ToString(); // CH_PERC_ONDATE.ToString();
                            dr1["CH_PERC_TODATE"] = EZCHToDatePerc.ToString();  // CH_PERC_TODATE.ToString();
                            dr1["CH_QTY_ONDATE"] = CH_QTY_ONDATE.ToString();
                            dr1["CH_QTY_TODATE"] = CH_QTY_TODATE.ToString();

                            dr1["MOL_PERC_BHY_TARGET"] = "0"; // MOL_PERC_BHY_TARGET.ToString();
                            dr1["MOL_PERC_BHY_ONDATE"] = EZLMBHOnDatePerc.ToString(); // MOL_PERC_BHY_ONDATE.ToString();
                            dr1["MOL_PERC_BHY_TODATE"] = EZLMBHToDatePerc.ToString(); // MOL_PERC_BHY_TODATE.ToString();
                            dr1["MOL_PERC_CHY_TARGET"] = "0"; // MOL_PERC_CHY_TARGET.ToString();
                            dr1["MOL_PERC_CHY_ONDATE"] = EZLMCHOnDatePerc.ToString();  // MOL_PERC_CHY_ONDATE.ToString();
                            dr1["MOL_PERC_CHY_TODATE"] = EZLMCHToDatePerc.ToString(); // MOL_PERC_CHY_TODATE.ToString();
                            dr1["MOL_PERC_BCHY_TARGET"] = "0"; // MOL_PERC_BCHY_TARGET.ToString();
                            dr1["MOL_PERC_BCHY_ONDATE"] = EZLMBCHOnDatePerc.ToString(); // MOL_PERC_BCHY_ONDATE.ToString();
                            dr1["MOL_PERC_BCHY_TODATE"] = EZLMBCHToDatePerc.ToString(); // MOL_PERC_BCHY_TODATE.ToString();
                            dr1["STCANE_PERC_TARGET"] = "0"; // STCANE_PERC_TARGET.ToString();
                            dr1["STCANE_PERC_ONDATE"] = EZSTOnDatePerc.ToString(); // STCANE_PERC_ONDATE.ToString();
                            dr1["STCANE_PERC_TODATE"] = EZSTToDatePerc.ToString();// STCANE_PERC_TODATE.ToString();
                            dr1["BAGASE_PERC_TARGET"] = "0"; // BAGASE_PERC_TARGET.ToString();
                            dr1["BAGASE_PERC_ONDATE"] = EZBGOnDatePerc.ToString(); // BAGASE_PERC_ONDATE.ToString();
                            dr1["BAGASE_PERC_TODATE"] = EZBGToDatePerc.ToString(); // BAGASE_PERC_TODATE.ToString();
                            dr1["BAGASE_QTY_ONDATE"] = BAGASE_QTY_ONDATE.ToString();
                            dr1["BAGASE_QTY_TODATE"] = BAGASE_QTY_TODATE.ToString();

                            //dr1["ALHL_SYRUP_TARGET"] = ALHL_SYRUP_TARGET.ToString();
                            //dr1["ALHL_SYRUP_ONDATE"] = ALHL_SYRUP_ONDATE.ToString();
                            //dr1["ALHL_SYRUP_TODATE"] = ALHL_SYRUP_TODATE.ToString();
                            //dr1["ALHL_BH_TARGET"] = ALHL_BH_TARGET.ToString();
                            //dr1["ALHL_BH_ONDATE"] = ALHL_BH_ONDATE.ToString();
                            //dr1["ALHL_BH_TODATE"] = ALHL_BH_TODATE.ToString();
                            //dr1["ALHL_CH_TARGET"] = ALHL_CH_TARGET.ToString();
                            //dr1["ALHL_CH_ONDATE"] = ALHL_CH_ONDATE.ToString();
                            //dr1["ALHL_CH_TODATE"] = ALHL_CH_TODATE.ToString();
                            dr1["ALHL_TOTAL_TARGET"] = ALHL_TOTAL_TARGET.ToString();
                            dr1["ALHL_TOTAL_ONDATE"] = ALHL_TOTAL_ONDATE.ToString();
                            dr1["ALHL_TOTAL_TODATE"] = ALHL_TOTAL_TODATE.ToString();

                            dr1["POWER_PRODUCED_TARGET"] = POWER_PRODUCED_TARGET.ToString();
                            dr1["POWER_PRODUCED_ONDATE"] = POWER_PRODUCED_ONDATE.ToString();
                            dr1["POWER_PRODUCED_TODATE"] = POWER_PRODUCED_TODATE.ToString();
                            dr1["POWER_EXPORT_TARGET"] = POWER_EXPORT_TARGET.ToString();
                            dr1["POWER_EXPORT_ONDATE"] = POWER_EXPORT_ONDATE.ToString();
                            dr1["POWER_EXPORT_TODATE"] = POWER_EXPORT_TODATE.ToString();

                            dt1.Rows.Add(dr1);
                        }
                    }

                    decimal TCPSYRUP = 0;
                    decimal TCPBHY = 0;
                    decimal TCPFM = 0;
                    decimal TCPTOTAL = 0;
                    decimal TACH_SYRUP = 0;
                    decimal TACH_BHY = 0;
                    decimal TACH_FM = 0;
                    decimal TACHTOTAL = 0;
                    decimal TBL_ACH_SYRUP = 0;
                    decimal TBL_ACH_BHY = 0;
                    decimal TBL_ACH_FM = 0;
                    decimal TBLTOTAL = 0;
                    decimal TPOL_PERC_TARGET = 0;
                    decimal TPOL_PERC_ONDATE = 0;
                    decimal TPOL_PERC_TODATE = 0;
                    decimal TREC_PERC_TARGET = 0;
                    decimal TREC_PERC_ONDATE = 0;
                    decimal TREC_PERC_TODATE = 0;
                    decimal TSG_PROD_ONDATE = 0;
                    decimal TSG_PROD_TODATE = 0;
                    decimal TBH_PERC_TARGET = 0;
                    decimal TBH_PERC_ONDATE = 0;
                    decimal TBH_PERC_TODATE = 0;
                    decimal TBH_QTY_ONDATE = 0;
                    decimal TBH_QTY_TODATE = 0;

                    decimal TCH_PERC_TARGET = 0;
                    decimal TCH_PERC_ONDATE = 0;
                    decimal TCH_PERC_TODATE = 0;
                    decimal TCH_QTY_ONDATE = 0;
                    decimal TCH_QTY_TODATE = 0;

                    decimal TMOL_PERC_BHY_TARGET = 0;
                    decimal TMOL_PERC_BHY_ONDATE = 0;
                    decimal TMOL_PERC_BHY_TODATE = 0;
                    decimal TMOL_PERC_CHY_TARGET = 0;
                    decimal TMOL_PERC_CHY_ONDATE = 0;
                    decimal TMOL_PERC_CHY_TODATE = 0;
                    decimal TMOL_PERC_BCHY_TARGET = 0;
                    decimal TMOL_PERC_BCHY_ONDATE = 0;
                    decimal TMOL_PERC_BCHY_TODATE = 0;
                    decimal TSTCANE_PERC_TARGET = 0;
                    decimal TSTCANE_PERC_ONDATE = 0;
                    decimal TSTCANE_PERC_TODATE = 0;
                    decimal TBAGASE_PERC_TARGET = 0;
                    decimal TBAGASE_PERC_ONDATE = 0;
                    decimal TBAGASE_PERC_TODATE = 0;
                    decimal TBAGASE_QTY_ONDATE = 0;
                    decimal TBAGASE_QTY_TODATE = 0;

                    //decimal TALHL_SYRUP_TARGET = 0;
                    //decimal TALHL_SYRUP_ONDATE = 0;
                    // decimal TALHL_SYRUP_TODATE = 0;
                    //decimal TALHL_BH_TARGET = 0;
                    //decimal TALHL_BH_ONDATE = 0;
                    // decimal TALHL_BH_TODATE = 0;
                    //decimal TALHL_CH_TARGET = 0;
                    //decimal TALHL_CH_ONDATE = 0;
                    //decimal TALHL_CH_TODATE = 0;
                    decimal TALHL_TOTAL_TARGET = 0;
                    decimal TALHL_TOTAL_ONDATE = 0;
                    decimal TALHL_TOTAL_TODATE = 0;

                    decimal TPOWER_PRODUCED_TARGET = 0;
                    decimal TPOWER_PRODUCED_ONDATE = 0;
                    decimal TPOWER_PRODUCED_TODATE = 0;
                    decimal TPOWER_EXPORT_TARGET = 0;
                    decimal TPOWER_EXPORT_ONDATE = 0;
                    decimal TPOWER_EXPORT_TODATE = 0;

                    for (int w = 0; w < dt1.Rows.Count; w++)
                    {
                        if (w == 5 || w == 11 || w == 16)
                        {
                            TCPSYRUP += Convert.ToDecimal(dt1.Rows[w]["CPSYRUP"].ToString());
                            TCPBHY += Convert.ToDecimal(dt1.Rows[w]["CPBHY"].ToString());
                            TCPFM += Convert.ToDecimal(dt1.Rows[w]["CPFM"].ToString());
                            TCPTOTAL += Convert.ToDecimal(dt1.Rows[w]["CPTOTAL"].ToString());
                            TACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["ACH_SYRUP"].ToString());
                            TACH_BHY += Convert.ToDecimal(dt1.Rows[w]["ACH_BHY"].ToString());
                            TACH_FM += Convert.ToDecimal(dt1.Rows[w]["ACH_FM"].ToString());
                            TACHTOTAL += Convert.ToDecimal(dt1.Rows[w]["ACHTOTAL"].ToString());
                            TBL_ACH_SYRUP += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_SYRUP"].ToString());
                            TBL_ACH_BHY += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_BHY"].ToString());
                            TBL_ACH_FM += Convert.ToDecimal(dt1.Rows[w]["BL_ACH_FM"].ToString());
                            TBLTOTAL += Convert.ToDecimal(dt1.Rows[w]["BLTOTAL"].ToString());
                            TPOL_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TARGET"].ToString());
                            TPOL_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_ONDATE"].ToString());
                            TPOL_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["POL_PERC_TODATE"].ToString());
                            TREC_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TARGET"].ToString());
                            TREC_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_ONDATE"].ToString());
                            TREC_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["REC_PERC_TODATE"].ToString());
                            TSG_PROD_ONDATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_ONDATE"].ToString());
                            TSG_PROD_TODATE += Convert.ToDecimal(dt1.Rows[w]["SG_PROD_TODATE"].ToString());
                            TBH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TARGET"].ToString());
                            TBH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_ONDATE"].ToString());
                            TBH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_PERC_TODATE"].ToString());
                            TBH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_ONDATE"].ToString());
                            TBH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BH_QTY_TODATE"].ToString());

                            TCH_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TARGET"].ToString());
                            TCH_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_ONDATE"].ToString());
                            TCH_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_PERC_TODATE"].ToString());
                            TCH_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_ONDATE"].ToString());
                            TCH_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["CH_QTY_TODATE"].ToString());

                            TMOL_PERC_BHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TARGET"].ToString());
                            TMOL_PERC_BHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_ONDATE"].ToString());
                            TMOL_PERC_BHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BHY_TODATE"].ToString());
                            TMOL_PERC_CHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TARGET"].ToString());
                            TMOL_PERC_CHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_ONDATE"].ToString());
                            TMOL_PERC_CHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_CHY_TODATE"].ToString());
                            TMOL_PERC_BCHY_TARGET += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TARGET"].ToString());
                            TMOL_PERC_BCHY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_ONDATE"].ToString());
                            TMOL_PERC_BCHY_TODATE += Convert.ToDecimal(dt1.Rows[w]["MOL_PERC_BCHY_TODATE"].ToString());
                            TSTCANE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TARGET"].ToString());
                            TSTCANE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_ONDATE"].ToString());
                            TSTCANE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["STCANE_PERC_TODATE"].ToString());
                            TBAGASE_PERC_TARGET += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TARGET"].ToString());
                            TBAGASE_PERC_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_ONDATE"].ToString());
                            TBAGASE_PERC_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_PERC_TODATE"].ToString());
                            TBAGASE_QTY_ONDATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_ONDATE"].ToString());
                            TBAGASE_QTY_TODATE += Convert.ToDecimal(dt1.Rows[w]["BAGASE_QTY_TODATE"].ToString());

                            // TALHL_SYRUP_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TARGET"].ToString());
                            //TALHL_SYRUP_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_ONDATE"].ToString());
                            //  TALHL_SYRUP_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_SYRUP_TODATE"].ToString());
                            //TALHL_BH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TARGET"].ToString());
                            //TALHL_BH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_ONDATE"].ToString());
                            //TALHL_BH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_BH_TODATE"].ToString());
                            //TALHL_CH_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TARGET"].ToString());
                            //TALHL_CH_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_ONDATE"].ToString());
                            //  TALHL_CH_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_CH_TODATE"].ToString());

                            TALHL_TOTAL_TARGET += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TARGET"].ToString());
                            TALHL_TOTAL_ONDATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_ONDATE"].ToString());
                            TALHL_TOTAL_TODATE += Convert.ToDecimal(dt1.Rows[w]["ALHL_TOTAL_TODATE"].ToString());

                            TPOWER_PRODUCED_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TARGET"].ToString());
                            TPOWER_PRODUCED_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_ONDATE"].ToString());
                            TPOWER_PRODUCED_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_PRODUCED_TODATE"].ToString());
                            TPOWER_EXPORT_TARGET += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TARGET"].ToString());
                            TPOWER_EXPORT_ONDATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_ONDATE"].ToString());
                            TPOWER_EXPORT_TODATE += Convert.ToDecimal(dt1.Rows[w]["POWER_EXPORT_TODATE"].ToString());
                        }
                    }

                    if (F_Name == "0")
                    {
                        dr1 = dt1.NewRow();
                        string total = "TOTAL";
                        dr1["FACTORY"] = total;
                        dr1["CPSYRUP"] = TCPSYRUP.ToString();
                        dr1["CPBHY"] = TCPBHY.ToString();
                        dr1["CPFM"] = TCPFM.ToString();
                        dr1["CPTOTAL"] = TCPTOTAL.ToString();
                        dr1["ACH_SYRUP"] = TACH_SYRUP.ToString();
                        dr1["ACH_BHY"] = TACH_BHY.ToString();
                        dr1["ACH_FM"] = TACH_FM.ToString();
                        dr1["ACHTOTAL"] = TACHTOTAL.ToString();
                        dr1["BL_ACH_SYRUP"] = TBL_ACH_SYRUP.ToString();
                        dr1["BL_ACH_BHY"] = TBL_ACH_BHY.ToString();
                        dr1["BL_ACH_FM"] = TBL_ACH_FM.ToString();
                        dr1["BLTOTAL"] = TBLTOTAL.ToString();
                        dr1["POL_PERC_TARGET"] = "0"; // TPOL_PERC_TARGET.ToString();
                        dr1["POL_PERC_ONDATE"] = BHSLPolOnDatePerc.ToString(); // TPOL_PERC_ONDATE.ToString();
                        dr1["POL_PERC_TODATE"] = BHSLPolToDatePerc.ToString(); // TPOL_PERC_TODATE.ToString();
                        dr1["REC_PERC_TARGET"] = "0"; // TREC_PERC_TARGET.ToString();
                        dr1["REC_PERC_ONDATE"] = BHSLprcpreondate.ToString(); // TREC_PERC_ONDATE.ToString();
                        dr1["REC_PERC_TODATE"] = BHSLprcpreTodate.ToString(); // TREC_PERC_TODATE.ToString();
                        dr1["SG_PROD_ONDATE"] = TSG_PROD_ONDATE.ToString();
                        dr1["SG_PROD_TODATE"] = TSG_PROD_TODATE.ToString();
                        dr1["BH_PERC_TARGET"] = "0"; // TBH_PERC_TARGET.ToString();
                        dr1["BH_PERC_ONDATE"] = BHSLBHOnDatePerc.ToString(); // TBH_PERC_ONDATE.ToString();
                        dr1["BH_PERC_TODATE"] = BHSLBHToDatePerc.ToString(); // TBH_PERC_TODATE.ToString();
                        dr1["BH_QTY_ONDATE"] = TBH_QTY_ONDATE.ToString();
                        dr1["BH_QTY_TODATE"] = TBH_QTY_TODATE.ToString();

                        dr1["CH_PERC_TARGET"] = "0"; // TCH_PERC_TARGET.ToString();
                        dr1["CH_PERC_ONDATE"] = BHSLCHOnDatePerc.ToString(); // TCH_PERC_ONDATE.ToString();
                        dr1["CH_PERC_TODATE"] = BHSLCHToDatePerc.ToString();// TCH_PERC_TODATE.ToString();
                        dr1["CH_QTY_ONDATE"] = TCH_QTY_ONDATE.ToString();
                        dr1["CH_QTY_TODATE"] = TCH_QTY_TODATE.ToString();

                        dr1["MOL_PERC_BHY_TARGET"] = "0"; // TMOL_PERC_BHY_TARGET.ToString();
                        dr1["MOL_PERC_BHY_ONDATE"] = BHSLLMBHOnDatePerc.ToString(); // TMOL_PERC_BHY_ONDATE.ToString();
                        dr1["MOL_PERC_BHY_TODATE"] = BHSLLMBHToDatePerc.ToString(); // TMOL_PERC_BHY_TODATE.ToString();
                        dr1["MOL_PERC_CHY_TARGET"] = "0"; // TMOL_PERC_CHY_TARGET.ToString();
                        dr1["MOL_PERC_CHY_ONDATE"] = BHSLLMCHOnDatePerc.ToString(); // TMOL_PERC_CHY_ONDATE.ToString();
                        dr1["MOL_PERC_CHY_TODATE"] = BHSLLMCHToDatePerc.ToString(); // TMOL_PERC_CHY_TODATE.ToString();
                        dr1["MOL_PERC_BCHY_TARGET"] = "0"; // TMOL_PERC_BCHY_TARGET.ToString();
                        dr1["MOL_PERC_BCHY_ONDATE"] = BHSLLMBCHOnDatePerc.ToString(); // TMOL_PERC_BCHY_ONDATE.ToString();
                        dr1["MOL_PERC_BCHY_TODATE"] = BHSLLMBCHToDatePerc.ToString(); // TMOL_PERC_BCHY_TODATE.ToString();
                        dr1["STCANE_PERC_TARGET"] = "0"; // TSTCANE_PERC_TARGET.ToString();
                        dr1["STCANE_PERC_ONDATE"] = BHSLSTOnDatePerc.ToString(); // TSTCANE_PERC_ONDATE.ToString();
                        dr1["STCANE_PERC_TODATE"] = BHSLSTToDatePerc.ToString(); // TSTCANE_PERC_TODATE.ToString();
                        dr1["BAGASE_PERC_TARGET"] = "0"; // TBAGASE_PERC_TARGET.ToString();
                        dr1["BAGASE_PERC_ONDATE"] = BHSLBGOnDatePerc.ToString(); // TBAGASE_PERC_ONDATE.ToString();
                        dr1["BAGASE_PERC_TODATE"] = BHSLBGToDatePerc.ToString();  // TBAGASE_PERC_TODATE.ToString();
                        dr1["BAGASE_QTY_ONDATE"] = TBAGASE_QTY_ONDATE.ToString();
                        dr1["BAGASE_QTY_TODATE"] = TBAGASE_QTY_TODATE.ToString();

                        //dr1["ALHL_SYRUP_TARGET"] = TALHL_SYRUP_TARGET.ToString();
                        //dr1["ALHL_SYRUP_ONDATE"] = TALHL_SYRUP_ONDATE.ToString();
                        // dr1["ALHL_SYRUP_TODATE"] = TALHL_SYRUP_TODATE.ToString();
                        //dr1["ALHL_BH_TARGET"] = TALHL_BH_TARGET.ToString();
                        //dr1["ALHL_BH_ONDATE"] = TALHL_BH_ONDATE.ToString();
                        // dr1["ALHL_BH_TODATE"] = TALHL_BH_TODATE.ToString();
                        //dr1["ALHL_CH_TARGET"] = TALHL_CH_TARGET.ToString();
                        //dr1["ALHL_CH_ONDATE"] = TALHL_CH_ONDATE.ToString();
                        // dr1["ALHL_CH_TODATE"] = TALHL_CH_TODATE.ToString();
                        dr1["ALHL_TOTAL_TARGET"] = TALHL_TOTAL_TARGET.ToString();
                        dr1["ALHL_TOTAL_ONDATE"] = TALHL_TOTAL_ONDATE.ToString();
                        dr1["ALHL_TOTAL_TODATE"] = TALHL_TOTAL_TODATE.ToString();

                        dr1["POWER_PRODUCED_TARGET"] = TPOWER_PRODUCED_TARGET.ToString();
                        dr1["POWER_PRODUCED_ONDATE"] = TPOWER_PRODUCED_ONDATE.ToString();
                        dr1["POWER_PRODUCED_TODATE"] = TPOWER_PRODUCED_TODATE.ToString();
                        dr1["POWER_EXPORT_TARGET"] = TPOWER_EXPORT_TARGET.ToString();
                        dr1["POWER_EXPORT_ONDATE"] = TPOWER_EXPORT_ONDATE.ToString();
                        dr1["POWER_EXPORT_TODATE"] = TPOWER_EXPORT_TODATE.ToString();

                        dt1.Rows.Add(dr1);
                    }
                }
                else
                {
                    TempData["msg"] = "1";
                }
                foreach (DataRow dr in dt1.Rows)
                {

                    MainList.Add(

                        new TargetActualMISReport
                        {
                            FACTORY = Convert.ToString(dr["FACTORY"]),
                            CPSYRUP = Convert.ToString(dr["CPSYRUP"]),
                            CPBHY = Convert.ToString(dr["CPBHY"]),
                            CPFM = Convert.ToString(dr["CPFM"]),
                            CPTOTAL = Convert.ToString(dr["CPTOTAL"]),
                            ACH_SYRUP = Convert.ToString(dr["ACH_SYRUP"]),
                            ACH_BHY = Convert.ToString(dr["ACH_BHY"]),
                            ACH_FM = Convert.ToString(dr["ACH_FM"]),
                            ACHTOTAL = Convert.ToString(dr["ACHTOTAL"]),
                            BL_ACH_SYRUP = Convert.ToString(dr["BL_ACH_SYRUP"]),
                            BL_ACH_BHY = Convert.ToString(dr["BL_ACH_BHY"]),
                            BL_ACH_FM = Convert.ToString(dr["BL_ACH_FM"]),
                            BLTOTAL = Convert.ToString(dr["BLTOTAL"]),
                            POL_PERC_TARGET = Convert.ToString(dr["POL_PERC_TARGET"]),
                            POL_PERC_ONDATE = Convert.ToString(dr["POL_PERC_ONDATE"]),
                            POL_PERC_TODATE = Convert.ToString(dr["POL_PERC_TODATE"]),
                            REC_PERC_TARGET = Convert.ToString(dr["REC_PERC_TARGET"]),
                            REC_PERC_ONDATE = Convert.ToString(dr["REC_PERC_ONDATE"]),
                            REC_PERC_TODATE = Convert.ToString(dr["REC_PERC_TODATE"]),
                            SG_PROD_ONDATE = Convert.ToString(dr["SG_PROD_ONDATE"]),
                            SG_PROD_TODATE = Convert.ToString(dr["SG_PROD_TODATE"]),
                            BH_PERC_TARGET = Convert.ToString(dr["BH_PERC_TARGET"]),
                            BH_PERC_ONDATE = Convert.ToString(dr["BH_PERC_ONDATE"]),
                            BH_PERC_TODATE = Convert.ToString(dr["BH_PERC_TODATE"]),
                            BH_QTY_ONDATE = Convert.ToString(dr["BH_QTY_ONDATE"]),
                            BH_QTY_TODATE = Convert.ToString(dr["BH_QTY_TODATE"]),
                            CH_PERC_TARGET = Convert.ToString(dr["CH_PERC_TARGET"]),
                            CH_PERC_ONDATE = Convert.ToString(dr["CH_PERC_ONDATE"]),
                            CH_PERC_TODATE = Convert.ToString(dr["CH_PERC_TODATE"]),
                            CH_QTY_ONDATE = Convert.ToString(dr["CH_QTY_ONDATE"]),
                            CH_QTY_TODATE = Convert.ToString(dr["CH_QTY_TODATE"]),
                            MOL_PERC_BHY_TARGET = Convert.ToString(dr["MOL_PERC_BHY_TARGET"]),
                            MOL_PERC_BHY_ONDATE = Convert.ToString(dr["MOL_PERC_BHY_ONDATE"]),
                            MOL_PERC_BHY_TODATE = Convert.ToString(dr["MOL_PERC_BHY_TODATE"]),
                            MOL_PERC_CHY_TARGET = Convert.ToString(dr["MOL_PERC_CHY_TARGET"]),
                            MOL_PERC_CHY_ONDATE = Convert.ToString(dr["MOL_PERC_CHY_ONDATE"]),
                            MOL_PERC_CHY_TODATE = Convert.ToString(dr["MOL_PERC_CHY_TODATE"]),
                            MOL_PERC_BCHY_TARGET = Convert.ToString(dr["MOL_PERC_BCHY_TARGET"]),
                            MOL_PERC_BCHY_ONDATE = Convert.ToString(dr["MOL_PERC_BCHY_ONDATE"]),
                            MOL_PERC_BCHY_TODATE = Convert.ToString(dr["MOL_PERC_BCHY_TODATE"]),
                            STCANE_PERC_TARGET = Convert.ToString(dr["STCANE_PERC_TARGET"]),
                            STCANE_PERC_ONDATE = Convert.ToString(dr["STCANE_PERC_ONDATE"]),
                            STCANE_PERC_TODATE = Convert.ToString(dr["STCANE_PERC_TODATE"]),
                            BAGASE_PERC_TARGET = Convert.ToString(dr["BAGASE_PERC_TARGET"]),
                            BAGASE_PERC_ONDATE = Convert.ToString(dr["BAGASE_PERC_ONDATE"]),
                            BAGASE_PERC_TODATE = Convert.ToString(dr["BAGASE_PERC_TODATE"]),
                            BAGASE_QTY_ONDATE = Convert.ToString(dr["BAGASE_QTY_ONDATE"]),
                            BAGASE_QTY_TODATE = Convert.ToString(dr["BAGASE_QTY_TODATE"]),
                            ALHL_TOTAL_TARGET = Convert.ToString(dr["ALHL_TOTAL_TARGET"]),
                            ALHL_TOTAL_ONDATE = Convert.ToString(dr["ALHL_TOTAL_ONDATE"]),
                            ALHL_TOTAL_TODATE = Convert.ToString(dr["ALHL_TOTAL_TODATE"]),
                            POWER_PRODUCED_TARGET = Convert.ToString(dr["POWER_PRODUCED_TARGET"]),
                            POWER_PRODUCED_ONDATE = Convert.ToString(dr["POWER_PRODUCED_ONDATE"]),
                            POWER_PRODUCED_TODATE = Convert.ToString(dr["POWER_PRODUCED_TODATE"]),
                            POWER_EXPORT_TARGET = Convert.ToString(dr["POWER_EXPORT_TARGET"]),
                            POWER_EXPORT_ONDATE = Convert.ToString(dr["POWER_EXPORT_ONDATE"]),
                            POWER_EXPORT_TODATE = Convert.ToString(dr["POWER_EXPORT_TODATE"]),

                        }

                        );
                }

            }
            catch (Exception ex)
            {
                TempData["Exception"] = ex.Message;
            }
            return Json(MainList, JsonRequestBehavior.AllowGet);
        }
        #endregion
        [HttpGet]
        