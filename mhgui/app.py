import json
import os

from flask import Flask, redirect, render_template, request

from mhgui.db import DBClient


application = Flask(__name__)

# Set this based on your environment variable
IS_DEV = os.environ.get("FLASK_ENV") == "development"
print(IS_DEV)


@application.context_processor
def vite_assets():
    def vite_tag(entry):
        if IS_DEV:
            return f'<script type="module" src="http://localhost:5173/src/{entry}"></script>'

        # Use 'application' instead of 'app'
        manifest_path = os.path.join(
            application.static_folder, "dist", ".vite", "manifest.json"
        )
        try:
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            hashed_file = manifest[f"src/{entry}"]["file"]
            return f'<script type="module" src="/static/dist/{hashed_file}"></script>'
        except (FileNotFoundError, KeyError):
            return ""

    # Pass IS_DEV as 'is_dev' for easier template logic
    return dict(vite_tag=vite_tag, is_dev=IS_DEV)


@application.route("/")
def index():
    return redirect("/items")


@application.route("/items")
def items():
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
