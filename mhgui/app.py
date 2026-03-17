from flask import Flask, render_template

from mhgui.db import DBClient


app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/suggestions/<query>")
def suggestions(query: str):
    client = DBClient()
    return client.search_items(query)
