import re
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


def clean_text(text: str) -> str:
    return re.sub(r"[^\x00-\x7f]", r"", text).strip()


# URL of the Monster Hunter Generations Ultimate item list
url = "https://monsterhunter.fandom.com/wiki/MHGU:_Item_List"

# Fandom often requires a User-Agent header to allow scraping
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# Fetch the page content
# read_html returns a list of all tables found on the page
tables = pd.read_html("mhgu.html")
print(f"Found {len(tables)} tables.")

# Example: Save each table to a CSV file
cleaned_tables = []
for df, category in zip(tables, CATEGORIES):
    df = (
        df.dropna(how="all")
        .drop(columns=0)
        .drop(index=0)
        .rename(
            columns={
                1: "name",
                2: "rarity",
                3: "capacity",
                4: "value",
                5: "how_to_get",
            }
        )
    )
    df["category"] = category
    df["capacity"] = df["capacity"].map(lambda x: x.replace("x", ""))
    df["value"] = df["value"].map(lambda x: x.replace("z", ""))
    print(df.loc[~df["capacity"].str.match(r"x[0-9]+")])
    df["name"] = df["name"].map(clean_text)
    cleaned_tables.append(df)

items_table = pd.concat(cleaned_tables, ignore_index=True)
items_table.to_csv("mhgu_items.csv", index=False)
