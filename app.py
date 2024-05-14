import pandas as pd
import numpy as np
import pycountry


# =============================================================================
# COUNTRY FILTERING
# =============================================================================

# Some country/entitiy names in the original raw csv are unrecognized by D3
# We want to remove the unsupported entities and add codes to unrecognized countries


def get_country_code(country_name, custom_mappings):
    if country_name in custom_mappings:
        return custom_mappings[country_name]

    try:
        return pycountry.countries.get(name=country_name).alpha_3
    except:
        return None


def add_country_codes(csv_file_path, output_file_path):
    # Custom mappings for unrecognized countries
    custom_mappings = {
        "Bolivia": "BOL",
        "British Virgin Islands": "VGB",
        "Brunei": "BRN",
        "Cape Verde": "CPV",
        "Cote d'Ivoire": "CIV",
        "Democratic Republic of Congo": "COD",
        "East Timor": "TLS",
        "Iran": "IRN",
        "Laos": "LAO",
        "Micronesia (country)": "FSM",
        "Moldova": "MDA",
        "Netherlands Antilles": "ANT",
        "North Korea": "PRK",
        "Palestine": "PSE",
        "Reunion": "REU",
        "Russia": "RUS",
        "Saint Barthelemy": "BLM",
        "Saint Helena": "SHN",
        "South Korea": "KOR",
        "Syria": "SYN",
        "Taiwan": "TWN",
        "Tanzania": "TZA",
        "Turkey": "TUR",
        "United States Virgin Islands": "VIR",
        "Venezuela": "VEN",
        "Vietnam": "VNM",
    }

    # Entities to be removed
    entities_to_remove = [
        "Africa",
        "Asia",
        "Czechoslovakia",
        "East Germany",
        "Europe",
        "European Union (27)",
        "High-income countries",
        "Low-income countries",
        "Lower-middle-income countries",
        "North America",
        "North Yemen",
        "Oceania",
        "Serbia and Montenegro",
        "South America",
        "South Yemen",
        "USSR",
        "Upper-middle-income countries",
        "West Germany",
        "World",
        "Yugoslavia",
    ]

    # Read the CSV file
    df = pd.read_csv(csv_file_path)

    # Filter out the rows with entities to be removed
    df = df[~df["Country"].isin(entities_to_remove)]

    # Write to a new CSV file
    df.to_csv(output_file_path, index=False)


# Create the filtered CSV file
csv_file_path = "archive/co2-emissions-transport.csv"
output_file_path = "source.csv"
# add_country_codes(csv_file_path, output_file_path)
# print("Filtered source.csv file created.")


# =============================================================================
# CUSTOM DATA GENERATION
# =============================================================================

# Load the existing source.csv data
source_csv_path = "source.csv"
data = pd.read_csv(source_csv_path)

# Get the unique countries and their codes
countries = data[["Country", "Code"]].drop_duplicates()

# Years to add
new_years = [2021, 2022, 2023, 2024]

# Generate random emissions data and append to the original data
new_data = []

for _, row in countries.iterrows():
    country = row["Country"]
    code = row["Code"]
    for year in new_years:
        emission = np.random.uniform(0, 1_000_000_000)  # Generate random emissions
        new_data.append([country, code, year, emission])

# Create a DataFrame for the new data
new_data_df = pd.DataFrame(
    new_data,
    columns=["Country", "Code", "Year", "Carbon_dioxide_emissions_from_transport"],
)

# Append the new data to the original data
updated_data = pd.concat([data, new_data_df], ignore_index=True)

# Save the updated data to a new CSV file
updated_data.to_csv("custom_data.csv", index=False)

print("New custom_data.csv file created with additional years 2021-2024.")
