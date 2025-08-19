# insert_raw_features.py
import os
import math
import pandas as pd
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "logistics")
MONGO_COL = os.getenv("MONGO_COL", "shipments_raw")
CSV_PATH = os.getenv("CSV_PATH")

assert MONGO_URI and CSV_PATH, "MONGO_URI, CSV_PATH 환경변수를 설정하세요."

# 원본 CSV의 모든 주요 컬럼
KEEP_COLS = [
    "ID",
    "Warehouse_block",
    "Mode_of_Shipment",
    "Customer_care_calls",
    "Customer_rating",
    "Cost_of_the_Product",
    "Prior_purchases",
    "Product_importance",
    "Gender",
    "Discount_offered",
    "Weight_in_gms",
    "Reached.on.Time_Y.N",
]

# 컬럼명 매핑 (카멜케이스로)
RENAME_MAP = {
    "ID": "id",
    "Warehouse_block": "warehouseBlock",
    "Mode_of_Shipment": "modeOfShipment",
    "Customer_care_calls": "customerCareCalls",
    "Customer_rating": "customerRating",
    "Cost_of_the_Product": "costOfProduct",
    "Prior_purchases": "priorPurchases",
    "Product_importance": "productImportance",
    "Gender": "gender",
    "Discount_offered": "discountOffered",
    "Weight_in_gms": "weightInGms",
    "Reached.on.Time_Y.N": "reachedOnTimeYN",
}

def coerce_numeric(s: pd.Series, is_int=False) -> pd.Series:
    s2 = pd.to_numeric(s, errors="coerce")
    if is_int:
        return s2.fillna(0).astype(int)
    return s2

def load_and_clean(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    missing = [c for c in KEEP_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV 컬럼 없음: {missing}")

    df = df[KEEP_COLS].copy()

    # 숫자형 강제 변환
    df["ID"] = coerce_numeric(df["ID"], is_int=True)
    df["Customer_care_calls"] = coerce_numeric(df["Customer_care_calls"], is_int=True)
    df["Customer_rating"] = coerce_numeric(df["Customer_rating"], is_int=True)
    df["Cost_of_the_Product"] = coerce_numeric(df["Cost_of_the_Product"], is_int=True)
    df["Prior_purchases"] = coerce_numeric(df["Prior_purchases"], is_int=True)
    df["Discount_offered"] = coerce_numeric(df["Discount_offered"], is_int=True)
    df["Weight_in_gms"] = coerce_numeric(df["Weight_in_gms"], is_int=True)
    df["Reached.on.Time_Y.N"] = coerce_numeric(df["Reached.on.Time_Y.N"], is_int=True)

    # 결측값 제거
    df = df.dropna()

    # 컬럼명 통일
    df = df.rename(columns=RENAME_MAP)

    return df

def ensure_indexes(col):
    """자주 쓸 컬럼 인덱스 생성"""
    col.create_index([("id", ASCENDING)], unique=True)
    col.create_index([("warehouseBlock", ASCENDING)])
    col.create_index([("modeOfShipment", ASCENDING)])
    col.create_index([("customerRating", ASCENDING)])
    col.create_index([("costOfProduct", ASCENDING)])
    col.create_index([("weightInGms", ASCENDING)])
    col.create_index([("reachedOnTimeYN", ASCENDING)])

def insert_batch(col, docs, batch_size=50_000):
    n = len(docs)
    if n == 0:
        return 0
    batches = math.ceil(n / batch_size)
    inserted = 0
    for i in range(batches):
        start = i * batch_size
        end = min((i + 1) * batch_size, n)
        chunk = docs[start:end]
        if not chunk:
            continue
        res = col.insert_many(chunk, ordered=False)
        inserted += len(res.inserted_ids)
        print(f"  · batch {i+1}/{batches}: {len(res.inserted_ids)} inserted")
    return inserted

def main():
    print("▶ CSV 로드/정규화...")
    df = load_and_clean(CSV_PATH)
    print(f"  rows(valid): {len(df):,}")

    print("▶ Atlas 연결...")
    client = MongoClient(MONGO_URI)
    col = client[MONGO_DB][MONGO_COL]

    print("▶ 인덱스 생성...")
    ensure_indexes(col)

    print("▶ 배치 insert...")
    docs = df.to_dict(orient="records")
    inserted = insert_batch(col, docs)
    print(f"✅ 완료: inserted {inserted:,} docs into {MONGO_DB}.{MONGO_COL}")

if __name__ == "__main__":
    main()
