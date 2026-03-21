from io import StringIO
import re
from typing import Generator
import numpy as np
import pandas as pd
import httpx
from bs4 import BeautifulSoup
from wiki_utils import clean_cell


def parse_yield(yield_str: str):
    # Regex captures the number after 'x' and optionally the number inside '( %)'
    pattern = r"x(\d+)(?:\s*\((\d+)%\))?"
    matches = re.findall(pattern, yield_str)

    results = []
    for qty, prob in matches:
        results.append({"quantity": int(qty), "chance": int(prob) if prob else 100})

    return results


class KiranicoTableScraper:
    base_url = "https://mhgu.kiranico.com"
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

    maps = {
        "759e5": "J. Frontier",
        "854d5": "V. Hills",
        "a5375": "A. Ridge",
        "75065": "M. Peaks",
        "e58e5": "Dunes",
        "d5d85": "D. Island",
        "757b5": "Marshlands",
        "e5b45": "Volcano",
        "65a35": "Arena",
        "56485": "V. Slayground",
        "5edd5": "A. Steppe",
        "596e5": "V. Hollow",
        "540d5": "Primal Forest",
        "53675": "F. Seaway",
        "50b65": "F. Slayground",
        "58de5": "Sanctuary",
        "5d385": "Forlorn Arena",
        "57db5": "S. Pinnacle",
        "5b945": "Ingle Isle",
        "5a035": "Polar Field",
        "56a85": "Wyvern's End",
        "5ebd5": "Desert",
        "59ee5": "Jungle",
        "548d5": "Ruined Pinnacle",
        "53375": "Castle Schrade",
        "50765": "Fortress",
        "586e5": "Forlorn Citadel",
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
        for df in pd.read_html(StringIO(html), encoding="utf-8"):
            yield df

    def scrape_combinations(self) -> None:
        soup = self.get_soup("combine")
        dfs = self.scrape_tables("combine")

        df = list(dfs)[-1]
        df = (
            df.drop(df.columns[1], axis=1)
            .drop(df.columns[3], axis=1)
            .rename(
                columns={
                    0: "result",
                    2: "first_ingredient",
                    4: "second_ingredient",
                    5: "success_chance",
                    6: "amount_crafted",
                    7: "affected_by",
                }
            )
            .assign(
                success_chance=lambda x: x["success_chance"].str.replace(
                    "%", "", regex=False
                ),
                amount_crafted=lambda x: x["amount_crafted"].map(parse_yield),
            )
            # .melt(
            #    id_vars=["result", "success_chance", "amount_crafted", "affected_by"],
            #    value_vars=["first_ingredient", "second_ingredient"],
            #    value_name="ingredient",
            # )
            # .drop("variable", axis=1)
        )
        print(df["amount_crafted"])
        print(f"{self.data_dir}/combinations.csv")
        df.to_csv(f"{self.data_dir}/combinations.csv", index=False)

    def scrape_maps(self) -> None:
        cleaned_tables = []
        for map_id, map_name in self.maps.items():
            print(f"Scraping {map_name}...")
            soup = self.get_soup(f"map/{map_id}")
            dfs = list(self.scrape_tables(f"map/{map_id}"))[10:]

            h4_headers = soup.find_all("h4")
            h5_headers = ["low", "high", "g"]
            header_data = [
                (h4.text.replace("Area", ""), h5)
                for h4 in h4_headers
                for h5 in h5_headers
            ]

            for df, (area, rank) in zip(dfs, header_data):
                pattern = r"(?:(?P<appear_chance>\d+)%\s+)?x(?P<min>\d+)〜(?P<max>\d+)"
                amount_pattern = r"(?P<name_clean>.*?)(?:\s+x(?P<amount>\d+))?$"

                df = (
                    df.rename(columns={0: "attempts", 1: "name", 2: "chance"})
                    .assign(
                        map=map_name,
                        area=area,
                        rank=rank,
                        node=lambda x: x["name"].isna().cumsum(),
                        chance=lambda x: x["chance"].str.replace("%", "", regex=False),
                    )
                    .dropna(subset=["name"])
                    # First extraction for attempts/min/max
                    .join(df[0].str.extract(pattern))
                    # Second extraction for name and yield
                    .join(df[1].str.extract(amount_pattern))
                    .assign(
                        item=lambda x: np.where(x["min"].isna(), x["attempts"], np.nan),
                        # Fill missing yields with 1 and convert to integer
                        amount=lambda x: x["amount"].fillna(1).astype(int),
                    )
                    # Drop the original 'name' column if you prefer the 'name_clean' version
                    .drop(columns=["name", "attempts"])
                    .rename(columns={"name_clean": "name"})
                )
                cleaned_tables.append(df)
        result = pd.concat(cleaned_tables, ignore_index=True)
        result.to_csv(f"{self.data_dir}/gathering_yields.csv", index=False)


if __name__ == "__main__":
    scraper = KiranicoTableScraper()
    # scraper.scrape_combinations()
    scraper.scrape_maps()
