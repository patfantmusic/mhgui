from io import StringIO
from typing import Generator
import pandas as pd
import httpx
from bs4 import BeautifulSoup
from wiki_utils import clean_cell


class MHWikiTableScraper:
    base_url = "https://monsterhunter.fandom.com/wiki"
    cache_dir = "scrape/cache"
    data_dir = "static/data"
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Sec-GPC": "1",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }

    def __init__(self):
        self.client = httpx.Client(
            base_url=self.base_url,
            headers=self.headers,
        )

    def get_html(self, endpoint, from_cache=True):
        if from_cache:
            try:
                with open(f"{self.cache_dir}/{endpoint}.html", "r") as input_file:
                    return input_file.read()
            except FileNotFoundError:
                pass

        print(f"Getting response for {self.base_url}/{endpoint}...")
        response = self.client.get(f"./{endpoint}")
        response.raise_for_status()

        with open(f"{self.cache_dir}/{endpoint}.html", "w") as output_file:
            output_file.write(response.text)

        return response.text

    def get_soup(self, endpoint):
        return BeautifulSoup(self.get_html(endpoint), "lxml")

    def scrape_tables(
        self, endpoint, table_selector=".article-table"
    ) -> Generator[pd.DataFrame, None, None]:
        """Generic method to find a table and return rows of text."""
        html = self.get_html(endpoint)
        for df in pd.read_html(StringIO(html), encoding="utf-8", extract_links="all"):
            yield df

    def scrape_items(self) -> None:
        soup = self.get_soup("MHGU:_Item_List")
        dfs = self.scrape_tables("MHGU:_Item_List")

        categories = [
            x.get_text() for x in soup.find_all("span", {"class": "mw-headline"})
        ]

        cleaned_tables = []
        for df, category in zip(dfs, categories):
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
                .map(clean_cell)
                .loc[lambda x: x["icon"] != x["name"]]
                .assign(
                    icon=lambda x: x["icon"].str.split(".png").str[0] + ".png",
                    capacity=lambda x: x["capacity"].str.replace("x|∞", "", regex=True),
                    value=lambda x: x["value"].str.replace("z", "", regex=False),
                    category=category,
                    name=lambda x: x["name"]
                    .str.replace(r"[^\x00-\x7f]+", "", regex=True)
                    .str.strip(),
                )
            )
            cleaned_tables.append(df)
        result = pd.concat(cleaned_tables, ignore_index=True)
        result.to_csv(f"{self.data_dir}/items.csv", index=False)

    def scrape_gu_materials(self) -> None:
        endpoint = "MHGU:_Monster_Material_List"
        output_file = "materials_gu.csv"

        soup = self.get_soup(endpoint)
        dfs = self.scrape_tables(endpoint)

        monster_names = []
        for span in soup.find_all("span", {"class": "mw-headline"}):
            text = span.get_text().strip()
            if text != "Small Monsters":
                monster_names.append(text)

        cleaned_tables = []
        for df, monster_name in zip(dfs, monster_names):
            # Define the transformation as a single fluent chain
            try:
                df = (
                    df.dropna(how="all")
                    .drop(index=0)
                    .rename(
                        columns={
                            0: "icon",
                            1: "name",
                            2: "rarity",
                            3: "value",
                            4: "description",
                        }
                    )
                    .map(clean_cell)
                    # Filter out decorative rows
                    .loc[lambda x: x["icon"] != x["name"]]
                    .assign(
                        icon=lambda x: x["icon"].str.split(".png").str[0] + ".png",
                        # Vectorized string cleaning
                        value=lambda x: x["value"].str.replace("z", "", regex=False),
                        # Add the monster name context
                        monster_name=monster_name,
                        # Strip non-ASCII (Japanese) text and whitespace
                        name=lambda x: x["name"]
                        .str.replace(r"[^\x00-\x7f]+", "", regex=True)
                        .str.strip(),
                    )
                )
            except Exception as e:
                print(e)
                continue
            cleaned_tables.append(df)
        result = pd.concat(cleaned_tables, ignore_index=True)
        result.to_csv(f"{self.data_dir}/{output_file}", index=False)

    def scrape_gen_materials(self) -> None:
        endpoint = "MHGen:_Monster_Material_List"
        output_file = "materials_gen.csv"

        soup = self.get_soup(endpoint)
        dfs = self.scrape_tables(endpoint)

        monster_names = []
        for span in soup.find_all("span", {"class": "mw-headline"}):
            text = span.get_text().strip()
            if text != "Small Monsters":
                monster_names.append(text)

        cleaned_tables = []
        for df, monster_name in zip(list(dfs)[1:], monster_names[1:]):
            # Define the transformation as a single fluent chain
            try:
                df = (
                    df.dropna(how="all")
                    .drop(df.columns[5:10], axis=1)
                    .drop(index=0)
                    .rename(
                        columns={
                            0: "icon",
                            1: "name",
                            2: "rarity",
                            3: "value",
                            4: "description",
                        }
                    )
                    .map(clean_cell)
                    # Filter out decorative rows
                    .loc[lambda x: x["icon"] != x["name"]]
                    .assign(
                        icon=lambda x: x["icon"].str.split(".png").str[0] + ".png",
                        # Vectorized string cleaning
                        value=lambda x: x["value"].str.replace("z", "", regex=False),
                        # Add the monster name context
                        monster_name=monster_name,
                        # Strip non-ASCII (Japanese) text and whitespace
                        name=lambda x: x["name"]
                        .str.replace(r"[^\x00-\x7f]+", "", regex=True)
                        .str.strip(),
                    )
                )
            except Exception as e:
                print(e)
                continue
            cleaned_tables.append(df)
        result = pd.concat(cleaned_tables, ignore_index=True)
        result.to_csv(f"{self.data_dir}/{output_file}", index=False)


if __name__ == "__main__":
    scraper = MHWikiTableScraper()
    scraper.scrape_items()
    scraper.scrape_gu_materials()
    scraper.scrape_gen_materials()
