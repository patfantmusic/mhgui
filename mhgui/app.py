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
    return client.search_items(query, exclude=exclude)
