from flask import Flask, render_template, request

from mhgui.db import DBClient


application = Flask(__name__)


@application.route("/")
def index():
    return render_template("index.html")


@application.route("/suggestions/<query>")
def suggestions(query: str):
    client = DBClient()
    exclude = request.args.get("exclude").split(",")
    types = request.args.get("types").split(",")
    results = []
    if "item" in types:
        results += client.search_items(query, exclude=exclude)
    if "material" in types:
        results += client.search_materials(query)
    return results
