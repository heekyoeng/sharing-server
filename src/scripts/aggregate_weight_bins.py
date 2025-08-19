from urllib.parse import urlparse
def print_where(client):
    try:
        hello = client.admin.command("hello")
        hosts = hello.get("hosts") or hello.get("hosts", [])
        primary = hello.get("primary")
    except Exception as e:
        hosts, primary = [], f"hello failed: {e}"
    parsed = urlparse(MONGO_URI.replace("mongodb+srv://","https://"))
    print("▶ MONGO_URI host:", parsed.hostname)
    print("▶ hello.hosts:", hosts)
    print("▶ hello.primary:", primary)
    print("▶ DB_NAME:", DB_NAME, " RAW_COL:", RAW_COL, " OUT_COL:", OUT_COL)
    db = client[DB_NAME]
    print("▶ DBs:", client.list_database_names())
    print("▶ Collections(logistics):", db.list_collection_names())
    print("▶ Count(shipments_raw):", db[RAW_COL].count_documents({}))

# aggregate_weight_bins.py
import os
import certifi
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")  # mongodb+srv://...
DB_NAME   = os.getenv("MONGO_DB", "logistics")
RAW_COL   = os.getenv("MONGO_COL_RAW", "shipments_features_raw")
OUT_COL   = os.getenv("MONGO_COL_OUT", "shipments_weight_bins")
BUCKETS   = int(os.getenv("BUCKETS", "10"))  # 기본 10분위
def peek_samples(col, limit=5):
    # 타입 분포
    pipeline = [
        {"$project": {
            "_id": 0,
            "wType": {"$type": "$weightInGms"},
            "rType": {"$type": "$reachedOnTimeYN"},
        }},
        {"$group": {"_id": {"wType": "$wType", "rType": "$rType"}, "n": {"$sum": 1}}},
        {"$sort": {"n": -1}}
    ]
    print("▶ Type mix:", list(col.aggregate(pipeline))[:10])

    # 원시값 일부
    print("▶ Sample docs:")
    for d in col.find({}, {"_id":0, "weightInGms":1, "reachedOnTimeYN":1}).limit(limit):
        print(repr(d))
def get_client():
    return MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where(),
        server_api=ServerApi("1"),
        connectTimeoutMS=20000,
        socketTimeoutMS=45000,
        retryWrites=True,
    )

def debug_counts(col):
    """집계 단계별 문서 수 진단"""
    stages = [
        {
          "$facet": {
            "total": [
                { "$count": "n" }
            ],
            "hasFields": [
                { "$match": { "weightInGms": { "$exists": True, "$ne": None },
                              "reachedOnTimeYN": { "$exists": True, "$ne": None } } },
                { "$count": "n" }
            ],
            "converted": [
                { "$addFields": {
                    "rawWeight":  { "$replaceAll": { "input": { "$toString": "$weightInGms" }, "find": ",", "replacement": "" } },
                    "weightNum":  { "$convert": { "input": "$rawWeight", "to": "double", "onError": None, "onNull": None } },
                    "reachedNum": { "$convert": { "input": "$reachedOnTimeYN", "to": "int", "onError": None, "onNull": None } }
                }},
                { "$match": { "weightNum": { "$ne": None }, "reachedNum": { "$in": [0,1] } } },
                { "$count": "n" }
            ]
          }
        }
    ]
    result = list(col.aggregate(stages))
    print("▶ Debug counts:", result)

def build_pipeline(buckets: int):
    return [
        {"$match": {
            "weightInGms": {"$ne": None},
            "reachedOnTimeYN": {"$in": [0, 1]}
        }},
        {"$bucketAuto": {
            "groupBy": "$weightInGms",
            "buckets": buckets,
            "output": {
                "total":  {"$sum": 1},
                "onTime": {"$sum": {"$cond": [{"$eq": ["$reachedOnTimeYN", 1]}, 1, 0]}},
                "minW":   {"$min": "$weightInGms"},
                "maxW":   {"$max": "$weightInGms"}
            }
        }},
        {"$project": {
            "_id": 0,
            "binMin": "$minW",
            "binMax": "$maxW",
            "binCenter": {"$divide": [{"$add": ["$minW","$maxW"]}, 2]},
            "total": 1,
            "onTimeRate": {
                "$cond": [{"$gt": ["$total", 0]}, {"$divide": ["$onTime","$total"]}, 0]
            }
        }},
        {"$sort": {"binCenter": 1}}
    ]


def materialize_weight_bins(buckets: int = BUCKETS):
    client = get_client()
    print_where(client)
    db = client[DB_NAME]
    raw = db[RAW_COL]
    peek_samples(raw)
    out = db[OUT_COL]

    # 진단
    print("DBG:", DB_NAME, RAW_COL, OUT_COL)
    debug_counts(raw)

    pipeline = build_pipeline(buckets)
    docs = list(raw.aggregate(pipeline, allowDiskUse=True))

    out.delete_many({})
    if docs:
        computed_at = datetime.utcnow()
        for d in docs: d["computedAt"] = computed_at
        out.insert_many(docs)
        out.create_index("binCenter")

    client.close()
    return len(docs)


if __name__ == "__main__":
    n = materialize_weight_bins(BUCKETS)
    print(f"✅ materialized {n} weight-bin rows into '{DB_NAME}.{OUT_COL}'")
print("DBG:", DB_NAME, RAW_COL, OUT_COL)
def debug_counts(col):
    stages = [
        {
          "$facet": {
            "total":       [ { "$count": "n" } ],
            "hasFields":   [ { "$match": { "weightInGms": { "$exists": True, "$ne": None }, "reachedOnTimeYN": { "$exists": True, "$ne": None } } }, { "$count": "n" } ],
            "converted":   [
                { "$addFields": {
                    "rawWeight": { "$replaceAll": { "input": { "$toString": "$weightInGms" }, "find": ",", "replacement": "" } },
                    "weightNum": { "$convert": { "input": "$rawWeight", "to": "double", "onError": None, "onNull": None } },
                    "reachedNum":{ "$convert": { "input": "$reachedOnTimeYN", "to": "int", "onError": None, "onNull": None } }
                }},
                { "$match": { "weightNum": { "$ne": None }, "reachedNum": { "$in": [0,1] } } },
                { "$count": "n" }
            ]
          }
        }
    ]
    print(list(col.aggregate(stages)))