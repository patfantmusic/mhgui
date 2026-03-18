import re
from bs4 import BeautifulSoup
import pandas as pd
import requests


CATEGORIES = [
    "Healing & Buffs",
    "Tools",
    "Alchemy",
    "Ammo & Coatings",
    "Plants",
    "Minerals & Ores",
    "Fish",
    "Insects",
    "Kinsect Nectar",
    "Bones",
    "Sacs & Fluids",
    "Hyper",
    "Coins & Tickets",
    "Supply",
    "Account",
    "Miscellaneous",
    "Event",
]


def clean_png_link(link: str | None) -> str:
    if link:
        return link.split(".png")[0] + ".png"
    return ""


def clean_text(text: str) -> str:
    return re.sub(r"[^\x00-\x7f]", r"", text).strip()


def main():
    # URL of the Monster Hunter Generations Ultimate item list
    url = "https://monsterhunter.fandom.com/wiki/MHGU:_Item_List"

    # Fandom often requires a User-Agent header to allow scraping
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, features="lxml")
    for data in soup(["style", "script"]):
        # Remove tags
        data.decompose()
    body = str(soup.find("body"))
    with open("mhgu.html", "w") as output_file:
        output_file.write(body)
    # Fetch the page content
    # read_html returns a list of all tables found on the page
    # tables = pd.read_html("mhgu.html", encoding="utf-8", extract_links="all")
    tables = pd.read_html(
        "mhgu.html",
        encoding="utf-8",
        extract_links="all",
        storage_options={"User-Agent": headers["User-Agent"]},
    )
    print(f"Found {len(tables)} tables.")

    # Example: Save each table to a CSV file
    cleaned_tables = []
    for df, category in zip(tables, CATEGORIES):
        df = (
            df.dropna(how="all")
            .drop(index=0)
            .rename(
                columns={
                    0: "icon",
                    1: "name",
                    2: "rarity",
                    3: "capacity",
                    4: "value",
                    5: "how_to_get",
                }
            )
        )
        cleaned_table = df.map(lambda x: x[0])
        cleaned_table = cleaned_table[cleaned_table["icon"] != cleaned_table["name"]]
        cleaned_table["icon"] = df["icon"].map(lambda x: clean_png_link(x[1]))
        cleaned_table["category"] = category
        cleaned_table["capacity"] = cleaned_table["capacity"].map(
            lambda x: x.replace("x", "").replace("∞", "")
        )
        cleaned_table["value"] = cleaned_table["value"].map(
            lambda x: x.replace("z", "")
        )
        cleaned_table["name"] = cleaned_table["name"].map(clean_text)
        cleaned_tables.append(cleaned_table)

    items_table = pd.concat(cleaned_tables, ignore_index=True)
    print(items_table)
    items_table.to_csv(
        "mhgu_items.csv",
        index=False,
        columns=[
            "name",
            "category",
            "rarity",
            "value",
            "capacity",
            "how_to_get",
            "icon",
        ],
    )


if __name__ == "__main__":
    main()
