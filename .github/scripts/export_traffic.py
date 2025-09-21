import os
import gspread
import requests
from datetime import datetime
from oauth2client.service_account import ServiceAccountCredentials

# --- CONFIGURATION ---
# GitHub repository details
GITHUB_REPO = "YOUR_USERNAME/YOUR_REPO_NAME" # e.g., "google/gemini"

# Get credentials from environment variables (for GitHub Actions)
# For local testing, you can temporarily hardcode these or set them in your terminal
GITHUB_TOKEN = os.getenv('GH_TOKEN')
GOOGLE_SHEETS_CREDENTIALS = os.getenv('GOOGLE_SHEETS_CREDENTIALS')

# --- MAIN SCRIPT ---
def get_github_traffic(repo, token, metric):
    """Fetches view or clone traffic data from the GitHub API."""
    url = f"https://api.github.com/repos/{repo}/traffic/{metric}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # Raises an error for bad responses (4xx or 5xx)
        data = response.json()
        print(f"Successfully fetched {metric} data. Total: {data['count']}, Unique: {data['uniques']}.")
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching GitHub data for {metric}: {e}")
        return None

def main():
    """Main function to fetch data and write to Google Sheets."""
    # 1. Authenticate with Google Sheets
    try:
        scope = ["https://spreadsheets.google.com/feeds", 'https://www.googleapis.com/auth/spreadsheets',
                 "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]

        # Use credentials from environment variable
        creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_SHEETS_CREDENTIALS, scope)
        client = gspread.authorize(creds)

        # Open the worksheet
        # Make sure your service account email has editor access to this sheet
        sheet = client.open("GitHub Repo Traffic").sheet1
        print("Successfully connected to Google Sheets.")
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return

    # 2. Fetch traffic data from GitHub
    views_data = get_github_traffic(GITHUB_REPO, GITHUB_TOKEN, "views")
    clones_data = get_github_traffic(GITHUB_REPO, GITHUB_TOKEN, "clones")

    # 3. Prepare and append the data
    if views_data and clones_data:
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Create a new row with today's summary
        new_row = [
            today_str,
            views_data['count'],
            views_data['uniques'],
            clones_data['count'],
            clones_data['uniques']
        ]

        # Check if headers are needed
        if not sheet.get_all_values():
            sheet.append_row(["Date", "Total Views", "Unique Views", "Total Clones", "Unique Clones"])

        sheet.append_row(new_row)
        print(f"Successfully appended data for {today_str} to the sheet.")

if __name__ == "__main__":
    # For local testing, you need to set up the credentials file path
    # For example: os.environ['GOOGLE_SHEETS_CREDENTIALS'] = 'your-key-file.json'
    # And your GitHub token: os.environ['GH_TOKEN'] = 'your_github_token'

    # Check if credentials are set
    if not GITHUB_TOKEN or not GOOGLE_SHEETS_CREDENTIALS:
        print("Error: Required environment variables GH_TOKEN or GOOGLE_SHEETS_CREDENTIALS are not set.")
    else:
        main()
