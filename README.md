
## Environment Variables

This project uses Google Sheets as a database. To connect to your Google Sheet, you will need to create a service account and add the following environment variables to a `.env` file in the root of your project:

```
GOOGLE_SHEET_ID="YOUR_SPREADSHEET_ID"
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account-email@your-project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
```

### How to get your credentials:

1.  **Create a Google Sheet:**
    *   Create a new sheet in your Google Drive.
    *   The `GOOGLE_SHEET_ID` is the long string of characters in the URL: `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`.

2.  **Set up Sheets and Service Account:**
    *   In your Google Sheet, create two tabs (sheets): one named `ProcurementRequests` and another named `Users`.
    *   Set the headers for `ProcurementRequests`: `id`, `category`, `itemName`, `quantity`, `justification`, `submittedBy`, `status`, `createdAt`, `auditLog`.
    *   Set the headers for `Users`: `id`, `name`, `role`, `reportsTo`. The `role` can be one of: `state`, `district`, `taluka`, `base`. The `reportsTo` field should contain the `id` of the user's manager.
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Enable the **Google Sheets API** for your project.
    *   Go to **Credentials**, click **+ CREATE CREDENTIALS**, and select **Service account**.
    *   Fill in the details for the service account. You can grant it the `Editor` role for simplicity.
    *   Once the account is created, click on it, go to the **KEYS** tab, click **ADD KEY**, and create a **New key**.
    *   Choose **JSON** as the key type. A JSON file will be downloaded.
    *   Back in your Google Sheet, click the **Share** button and share the sheet with the **client email** from the downloaded JSON file, giving it **Editor** access.


3.  **Add credentials to `.env` file:**
    *   `GOOGLE_SHEETS_CLIENT_EMAIL`: This is the `client_email` from the downloaded JSON file.
    *   `GOOGLE_SHEETS_PRIVATE_KEY`: This is the `private_key` from the JSON file. It's important to wrap it in quotes and preserve the `\n` characters for newlines.
