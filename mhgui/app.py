from flask import Flask, render_template

from mhgui.db import DBClient


application = Flask(__name__)


@application.route("/")
def index():
    return render_template("index.html")


@application.route("/suggestions/<query>")
def suggestions(query: str):
    client = DBClient()
    return client.search_items(query)
