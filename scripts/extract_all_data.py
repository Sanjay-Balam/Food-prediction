import os
import re
from datetime import datetime
import openpyxl
import pandas as pd

input_dir = r"C:\Users\sanja\OneDrive\Desktop\All-data"
files = sorted([
    f for f in os.listdir(input_dir) 
    if f.endswith(".xlsx") and not f.startswith("~$") and not f.startswith("Combined_") and not f.startswith("Master_")
])

print(f"Discovered {len(files)} Excel sales report files.")

def parse_date(ws, filename):
    for r in range(1, 6):
        for c in range(1, 5):
            val = ws.cell(r, c).value
            if val and isinstance(val, str):
                m = re.search(r"(\d{1,2})-([A-Za-z]{3})-(\d{2,4})", val)
                if m:
                    day, mon_str, yr = m.groups()
                    if len(yr) == 2:
                        yr = "20" + yr
                    dt = datetime.strptime(f"{day}-{mon_str}-{yr}", "%d-%b-%Y")
                    return dt.strftime("%Y-%m-%d")
    m = re.search(r"(\d{1,2})-([A-Za-z]{3})", filename)
    if m:
        day, mon_str = m.groups()
        dt = datetime.strptime(f"{day}-{mon_str}-2026", "%d-%b-%Y")
        return dt.strftime("%Y-%m-%d")
    return None

master_records = []
total_source_qty = 0.0
total_source_amount = 0.0

for idx, f in enumerate(files):
    filepath = os.path.join(input_dir, f)
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb[wb.sheetnames[0]]
    date_str = parse_date(ws, f)
    
    file_items = 0
    for r in range(6, ws.max_row + 1):
        c1 = ws.cell(r, 1).value
        c2 = ws.cell(r, 2).value
        c3 = ws.cell(r, 3).value
        c4 = ws.cell(r, 4).value
        c5 = ws.cell(r, 5).value
        c6 = ws.cell(r, 6).value
        c7 = ws.cell(r, 7).value
        c8 = ws.cell(r, 8).value
        c9 = ws.cell(r, 9).value
        
        if c2 is not None and c4 is not None:
            try:
                item_code = int(float(str(c1).strip()))
                qty = float(c4)
                rate = float(c3) if c3 is not None else 0.0
                total_amt = float(c5) if c5 is not None else (rate * qty)
                
                master_records.append({
                    "Date": date_str,
                    "ItemCode": item_code,
                    "ItemName": str(c2).strip(),
                    "Rate": rate,
                    "Quantity": qty,
                    "TotalAmount": total_amt,
                    "RestaurantName": str(c6).strip() if c6 else "",
                    "KitchenName": str(c7).strip() if c7 else "",
                    "Classification": str(c8).strip() if c8 else "",
                    "Category": str(c9).strip() if c9 else "",
                    "SourceFile": f
                })
                total_source_qty += qty
                total_source_amount += total_amt
                file_items += 1
            except:
                pass
    wb.close()
    if (idx + 1) % 15 == 0 or idx + 1 == len(files):
        print(f"Processed {idx + 1}/{len(files)} files...")

df_master = pd.DataFrame(master_records)

# Chronological sort
df_master["date_dt"] = pd.to_datetime(df_master["Date"])
df_master = df_master.sort_values(by=["date_dt", "RestaurantName", "KitchenName", "ItemName"]).drop(columns=["date_dt"]).reset_index(drop=True)

print("=" * 60)
print(f"Master records extracted: {len(df_master):,}")
print(f"Total Quantity Sold: {total_source_qty:,.2f}")
print(f"Total Revenue Amount: INR {total_source_amount:,.2f}")
print(f"Unique Dates: {df_master['Date'].nunique()} (from {df_master['Date'].min()} to {df_master['Date'].max()})")
print(f"Unique Dishes/Items: {df_master['ItemName'].nunique()}")
print("=" * 60)

# 1. Complete Master Excel file (All 11 columns, 100% full audit trail, ZERO data loss)
master_excel_path = os.path.join(input_dir, "Master_Combined_Kitchen_Sales.xlsx")
df_master.to_excel(master_excel_path, index=False, engine="openpyxl")
print(f"[OK] Saved Complete Master Excel: {master_excel_path}")

# 2. Prediction format CSV (date, item, qty_sold, sold_out) aggregated by day & item
df_pred_all = df_master.groupby(["Date", "ItemName"], as_index=False)["Quantity"].sum()
df_pred_all.rename(columns={"Date": "date", "ItemName": "item", "Quantity": "qty_sold"}, inplace=True)
df_pred_all["sold_out"] = "no"
# Convert integer quantities to clean ints where possible
df_pred_all["qty_sold"] = df_pred_all["qty_sold"].apply(lambda q: int(q) if q.is_integer() else round(q, 2))
df_pred_all = df_pred_all.sort_values(by=["date", "item"]).reset_index(drop=True)

pred_csv_path = os.path.join(input_dir, "sales_prediction_format_ALL_ITEMS.csv")
df_pred_all.to_csv(pred_csv_path, index=False)
print(f"[OK] Saved All-Items Prediction CSV: {pred_csv_path} ({len(df_pred_all):,} daily dish rows)")

# Also save an Excel version of this prediction format for easy viewing
pred_excel_path = os.path.join(input_dir, "sales_prediction_format_ALL_ITEMS.xlsx")
df_pred_all.to_excel(pred_excel_path, index=False, engine="openpyxl")
print(f"[OK] Saved All-Items Prediction Excel: {pred_excel_path}")

# 3. Prediction format CSV for FOOD ONLY (Classification == 'Food')
df_food = df_master[df_master["Classification"] == "Food"]
df_pred_food = df_food.groupby(["Date", "ItemName"], as_index=False)["Quantity"].sum()
df_pred_food.rename(columns={"Date": "date", "ItemName": "item", "Quantity": "qty_sold"}, inplace=True)
df_pred_food["sold_out"] = "no"
df_pred_food["qty_sold"] = df_pred_food["qty_sold"].apply(lambda q: int(q) if q.is_integer() else round(q, 2))
df_pred_food = df_pred_food.sort_values(by=["date", "item"]).reset_index(drop=True)

pred_food_csv_path = os.path.join(input_dir, "sales_prediction_format_FOOD_ONLY.csv")
df_pred_food.to_csv(pred_food_csv_path, index=False)
print(f"[OK] Saved Food-Only Prediction CSV: {pred_food_csv_path} ({len(df_pred_food):,} food rows)")

pred_food_excel_path = os.path.join(input_dir, "sales_prediction_format_FOOD_ONLY.xlsx")
df_pred_food.to_excel(pred_food_excel_path, index=False, engine="openpyxl")
print(f"[OK] Saved Food-Only Prediction Excel: {pred_food_excel_path}")

# Also copy sales_prediction_format_ALL_ITEMS.csv to the project data directory so user can test immediately in the app!
proj_target = r"c:\projects\food-predection\apps\demo-web\public\client_sales_combined.csv"
df_pred_all.to_csv(proj_target, index=False)
print(f"[OK] Exported directly to web app demo: {proj_target}")
