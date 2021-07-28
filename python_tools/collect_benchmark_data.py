from simple_celery.service_util.mongo_util import get_collection, get_document_from_id, get_documents_time_interval


def get_content_list(collection_docenter, collection_staticFeature, days, n=-1):
    if collection_docenter is not None:
        documents = get_documents_time_interval(collection_staticFeature,
                                                "insert_time",
                                                days,
                                                "now", ["_id"])
        documents_1 = []
        for doc in documents:
            if n >= 0 and len(documents_1) >= n:
                break
            _id = doc.get("_id")
            if _id is None:
                continue
            document = get_document_from_id(collection_docenter, _id, ["content_list", "url"])
            if documents is None:
                continue
            documents_1.append(document)
        return documents_1
    documents = get_documents_time_interval(collection_staticFeature,
                                            "insert_time",
                                            days,
                                            "now", ["content_list", "url"])
    return documents


def collect_benchmark_data(market, out_file, days="1d"):
    if market == "enus":
        collection_docenter = get_collection("docenter.document")
        collection_staticFeature = get_collection("staticFeature.document")
    else:
        collection_docenter = None
        collection_staticFeature = get_collection(f"{market}.staticFeature.document")
    documents = get_content_list(collection_docenter, collection_staticFeature, days, 100)
    with open(out_file, "w", encoding="UTF8") as out_f:
        for i, doc in enumerate(documents):
            print(i)
            _id = doc.get("_id")
            if _id is None:
                continue
            content_list = doc.get("content_list")
            if content_list is None:
                continue
            url = doc.get("url")
            if url is None:
                continue
            content_list = [x["data"] for x in content_list if x["type"] == "text"]
            content_list = [x.strip() for x in content_list if len(x.strip()) > 0]
            if len(content_list) == 0:
                continue
            out_f.write(f"{_id}\t{url}")
            for c in content_list:
                out_f.write("\t" + c)
            out_f.write("\n")


if __name__ == "__main__":
    collect_benchmark_data("enus", "./enus_content_list.txt", "1h")
