"""
Scrapes data from Kiranico (MHGU) and saves it as CSV files.

This module handles the retrieval and parsing of HTML tables regarding
combinations, map gathering yields, and skills from the MHGU Kiranico website.
"""

from io import StringIO
import re
from typing import Generator, List, Dict, Any
import numpy as np
import click
import pandas as pd
import httpx
from loguru import logger
from bs4 import BeautifulSoup


def parse_yield(yield_str: str) -> List[Dict[str, int]]:
    """
    Parses a yield string (e.g., "x2(50%)") into structured data.

    Args:
        yield_str: The string containing quantity and probability info.

    Returns:
        A list of dictionaries with 'quantity' and 'chance' keys.
    """
    pattern = r"x(\d+)(?:\s*\((\d+)%\))?"
    matches = re.findall(pattern, yield_str)

    results = []
    for qty, prob in matches:
        results.append({"quantity": int(qty), "chance": int(prob) if prob else 100})

    return results


class KiranicoTableScraper:
    """
    Scraper for the MHGU Kiranico website.

    Attributes:
        base_url: The base URL for the Kiranico MHGU wiki.
    """

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

    # Compiled Regex Patterns
    RE_GATHER_CHANCE = r"(?:(?P<appear_chance>\d+)%\s+)?x(?P<min>\d+)〜(?P<max>\d+)"
    RE_GATHER_ITEM = r"(?P<name_clean>.*?)(?:\s+x(?P<amount>\d+))?$"
    RE_ARMOR_DEFENSE = r"(?P<min_defense>\d+)\s*～\s*(?P<max_defense>\d+)"

    def __init__(self):
        self.client = httpx.Client(
            base_url=self.base_url,
            headers=self.headers,
        )

    def get_html(self, endpoint: str, from_cache: bool = True) -> str:
        """Retrieves HTML content, either from local cache or via HTTP request."""
        if from_cache:
            try:
                with open(f"{self.cache_dir}/{endpoint}.html", "r") as input_file:
                    return input_file.read()
            except FileNotFoundError:
                pass

        logger.info(f"Getting response for {self.base_url}/{endpoint}...")
        response = self.client.get(f"./{endpoint}")
        response.raise_for_status()

        with open(f"{self.cache_dir}/{endpoint}.html", "w") as output_file:
            output_file.write(response.text)

        return response.text

    def get_soup(self, endpoint: str) -> BeautifulSoup:
        """Returns a BeautifulSoup object for the given endpoint."""
        return BeautifulSoup(self.get_html(endpoint), "lxml")

    def scrape_tables(
        self, endpoint: str, table_selector: str = ".article-table"
    ) -> Generator[pd.DataFrame, None, None]:
        """Generic method to parse HTML tables into pandas DataFrames."""
        html = self.get_html(endpoint)
        for df in pd.read_html(StringIO(html), encoding="utf-8"):
            yield df

    def scrape_combinations(self) -> None:
        """Scrapes item combination recipes and saves to CSV."""
        soup = self.get_soup("combine")
        tables = list(self.scrape_tables("combine"))

        if not tables:
            logger.warning("No combination tables found.")
            return

        df = tables[-1]

        # Define mapping for only the columns you want to keep
        # Original structure assumes columns by index
        column_mapping = {
            0: "result",
            2: "first_ingredient",
            4: "second_ingredient",
            5: "success_chance",
            6: "amount_crafted",
            7: "affected_by",
        }

        # Select relevant columns and rename them
        df = df[list(column_mapping.keys())].rename(columns=column_mapping)

        # Clean and transform data
        df = df.assign(
            success_chance=lambda x: x["success_chance"].str.replace(
                "%", "", regex=False
            ),
            amount_crafted=lambda x: x["amount_crafted"].map(parse_yield),
        )

        df.to_csv(f"{self.data_dir}/combinations.csv", index=False)
        logger.success(f"Saved combinations to {self.data_dir}/combinations.csv")

    def scrape_maps(self) -> None:
        """Scrapes gathering spots and yields for all registered maps."""
        cleaned_tables = []

        for map_id, map_name in self.maps.items():
            endpoint = f"map/{map_id}"
            soup = self.get_soup(endpoint)
            # Skip the first 10 tables which are usually metadata/monsters
            dfs = list(self.scrape_tables(endpoint))[10:]

            # Generator for header pairs
            # This assumes strict structure: H4 (Area) followed by tables for Low, High, G rank
            header_data = (
                (h4.text.replace("Area", "").strip(), rank)
                for h4 in soup.find_all("h4")
                for rank in ["low", "high", "g"]
            )

            for df, (area, rank) in zip(dfs, header_data):
                # Basic cleanup and context assignment
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
                    .assign(
                        # Extract yield/attempts info (e.g., "x2~4")
                        **df[0].str.extract(self.RE_GATHER_CHANCE).to_dict("series"),
                        # Extract item name and fixed amount (e.g., "Herb x2")
                        **df[1].str.extract(self.RE_GATHER_ITEM).to_dict("series"),
                    )
                    .assign(
                        # Normalize item yield logic
                        item=lambda x: np.where(x["min"].isna(), x["attempts"], np.nan),
                        amount=lambda x: x["amount"].fillna(1).astype(int),
                    )
                    .drop(columns=["name", "attempts"])
                    .rename(columns={"name_clean": "name"})
                )
                cleaned_tables.append(df)

        if not cleaned_tables:
            logger.warning("No map data scraped.")
            return

        pd.concat(cleaned_tables, ignore_index=True).to_csv(
            f"{self.data_dir}/gathering_yields.csv", index=False
        )
        logger.success(
            f"Saved gathering yields to {self.data_dir}/gathering_yields.csv"
        )

    def scrape_skills(self) -> None:
        """Scrapes list of armor skills."""
        soup = self.get_soup("skill")
        tables = list(self.scrape_tables("skill"))

        if not tables:
            logger.warning("No skill tables found.")
            return

        df = tables[-1]

        # Map column indices to names
        column_mapping = {0: "skill", 1: "ability", 2: "points", 3: "description"}

        df = df.rename(columns=column_mapping).dropna(subset=["ability"])

        # Strip '+' from points
        df["points"] = df["points"].str.replace("+", "", regex=False)

        # Replace exact '-' with empty strings for cleaner CSVs
        columns_to_clean = ["ability", "points", "description"]
        for col in columns_to_clean:
            df[col] = df[col].replace(r"^-$", "", regex=True)

        df.to_csv(f"{self.data_dir}/skills.csv", index=False)
        logger.success(f"Saved skills to {self.data_dir}/skills.csv")

    def scrape_armor(self) -> None:
        """Scrapes armor set data."""
        cleaned_tables = []
        relation = []
        global_id_offset = 0
        for rarity in range(1, 12):
            endpoint = f"armor?rare={rarity}"
            soup = self.get_soup(endpoint)
            hunter_types = ("blademaster", "gunner")
            for hunter_type, df in zip(
                hunter_types, list(self.scrape_tables(endpoint))[-2:]
            ):
                df = (
                    df.rename(columns={"Unnamed: 2": "name"})
                    .assign(
                        armor_set_id=lambda x: x["name"].isna().cumsum() // 2
                        + global_id_offset,
                    )
                    .dropna(subset=["name"])
                    .assign(
                        **df["Defense"]
                        .str.extract(self.RE_ARMOR_DEFENSE)
                        .to_dict("series"),
                        fire=lambda x: x["Fir"]
                        .str.replace("+", "", regex=False)
                        .replace("-", "0"),
                        ice=lambda x: x["Ice"]
                        .str.replace("+", "", regex=False)
                        .replace("-", "0"),
                        thunder=lambda x: x["Thn"]
                        .str.replace("+", "", regex=False)
                        .replace("-", "0"),
                        water=lambda x: x["Wat"]
                        .str.replace("+", "", regex=False)
                        .replace("-", "0"),
                        dragon=lambda x: x["Dra"]
                        .str.replace("+", "", regex=False)
                        .replace("-", "0"),
                    )
                    .drop(columns=["Defense", "Fir", "Ice", "Thn", "Wat", "Dra"])
                )
                df["rarity"] = rarity
                df["hunter_type"] = hunter_type
                conditions = [
                    (df["Male"] == "○") & (df["Female"] == "○"),
                    (df["Male"] == "○"),
                    (df["Female"] == "○"),
                ]

                # Define the corresponding values
                choices = ["both", "male", "female"]

                # Create the new column
                df["wearable_by"] = np.select(conditions, choices, default="none")
                df["num_slots"] = df["Slots"].str.count("◯")

                flattened = df["Skill"].str.extractall(
                    r"(?P<skill_tree>[^:]+?):(?P<points>[\+\-]\d+)"
                )
                result = (
                    flattened.reset_index(level=0)
                    .merge(
                        df[["name", "armor_set_id"]],
                        left_on="level_0",
                        right_index=True,
                    )
                    .drop(columns="level_0")
                )
                result = (
                    result[["skill_tree", "name", "armor_set_id", "points"]]
                    .rename(columns={"name": "armor"})
                    .assign(
                        points=lambda x: x["points"].str.replace("+", "", regex=False),
                        skill_tree=lambda x: x["skill_tree"].str.strip(),
                    )
                )
                df = df.drop(columns=["Male", "Female", "Skill", "Slots"])

                if not df.empty:
                    global_id_offset = df["armor_set_id"].iloc[-1]

                cleaned_tables.append(df)
                relation.append(result)

        df = pd.concat(cleaned_tables, ignore_index=True)
        relation_df = pd.concat(relation, ignore_index=True)
        relation_df.to_csv(f"{self.data_dir}/armor_skills.csv", index=False)
        df.to_csv(f"{self.data_dir}/armor.csv", index=False)


@click.group()
def cli():
    """CLI for Kiranico Scraper."""
    pass


@cli.command()
def combinations():
    """Scrape item combinations."""
    KiranicoTableScraper().scrape_combinations()


@cli.command()
def maps():
    """Scrape map gathering data."""
    KiranicoTableScraper().scrape_maps()


@cli.command()
def skills():
    """Scrape armor skills."""
    KiranicoTableScraper().scrape_skills()


@cli.command()
def armor():
    """Scrape armor sets."""
    KiranicoTableScraper().scrape_armor()


if __name__ == "__main__":
    cli()
