# Katha User Guide

Katha is a PDF reading application with a personal library, page bookmarks and notes, study assistance, translation, narration, and site-wide background music.

## Contents

- [Sign in](#sign-in)
- [Manage your library](#manage-your-library)
- [Read a PDF](#read-a-pdf)
- [Use bookmarks and notes](#use-bookmarks-and-notes)
- [Study with AI](#study-with-ai)
- [Use narration](#use-narration)
- [Choose global background music](#choose-global-background-music)
- [Change appearance and account settings](#change-appearance-and-account-settings)
- [Troubleshooting](#troubleshooting)
- [Run Katha locally](#run-katha-locally)

## Sign in

### Sign in to an existing account

1. Open Katha in your browser.
2. Select **Sign In** (selected by default).
3. Enter your email address and password.
4. Select **Sign In**.
5. If the entered credentials are incorrect, Katha displays a pop-up alert and highlights the email and password fields in red with an inline error message indicating that the credentials are incorrect.
6. Alternatively, select **Sign in with a one-time code instead** to receive a six-digit sign-in code by email.

### Create a new user

1. In the sign-in page, select the **Create New User** tab (or the **Create a new user** link below the form).
2. Enter your name, email address, and a password of at least eight characters.
3. Select **Send sign-in code**.
4. Enter the six-digit code sent to your email and select **Verify and enter library**.
5. If the code does not arrive, choose **Resend code**. Use **Change email** to return to the first step.

Katha keeps a separate library for each signed-in account.

## Manage your library

### Add a PDF

1. Open **Library**.
2. Select **Upload PDF** and choose a PDF file from your computer.
3. Wait for the upload to finish. Katha accepts PDFs up to 50 MB.
4. The document appears in your library. Its title is initially based on the filename.

The app stores a private Katha copy in Supabase Storage. Uploading does not move or delete the original file on your computer.

### Open or resume a book

- Select a book card in your library to open it in the reader.
- If you have opened a book before, the library also shows a **Resume reading** shortcut for your most recently opened book.
- Katha saves the last page you visit, so you can continue from that page later.
- Use the **Reader** item in the sidebar to open the most recently read book (or the first book if you have not read one yet).

### Remove a PDF

1. In **Library**, select **Remove from Katha** under the book.
2. Confirm the removal in the browser confirmation dialog.

Removal deletes that book's Katha library record and the associated PDF object in Katha's private storage. Its notes and bookmarks are also removed with the document. It does **not** delete or change the source file on your computer. If removal fails, Katha displays an error rather than treating the operation as successful.

## Read a PDF

- Use **Previous page** and **Next page** below the PDF to navigate.
- The current page number is shown between the navigation buttons.
- Use **−** and **+** to zoom out or in.
- Katha saves your reading progress when you change pages.
- Select **☆ Bookmark page** to save the current page; it changes to **★ Bookmarked** when the page is already bookmarked.
- Enter text in **Add a note on page ...** and choose **Save note** to attach a note to the current page.
- Select **Finish study session** to send a study-session summary notification to your account email.

## Use bookmarks and notes

### Bookmarks

Open **Bookmarks** from the sidebar to see your saved pages. Select a book title to open that document at the bookmarked page. Use the trash button next to a bookmark to remove it.

### Notes

Open **Notes** from the sidebar to manage notes:

1. Choose a book.
2. Enter a page number and note text.
3. Select **Add note**.
4. Use **Search your notes...** to filter saved notes by their text or associated book title.
5. Use the trash button on a note to delete it.

You can also add a note for the current page from the reader. Notes and bookmarks belong to the current account and document.

## Study with AI

1. Open a book and select **Study with AI**.
2. In **Passage from your PDF**, paste or type the passage you want to work with. You can edit the text in this field.
3. Choose an action:
   - **Summarize** asks for a concise summary.
   - **Explain** asks for a plain-language explanation.
   - **Narrate** prepares the passage for spoken playback.
   - **Translate** translates the passage into the language selected in **Translate to**.
   - Enter a question in the question field and select **Send** to ask about the book. When the passage field is empty, the document's extracted PDF text is used as context for document questions.
4. AI responses and request errors appear in the conversation area.

The supported translation languages are **Tamil, Spanish, French, Hindi, and Arabic**. Tamil translations are checked for Tamil-script output. Translation requires the backend's OpenRouter integration to be configured; provider failures or unsuitable output are shown as errors.

## Use narration

Narration is available in the **Study with AI** panel:

1. Put the desired passage in the passage field.
2. Select **Narrate** and wait for the status to change from **Preparing** to **Playing**.
3. Select **Pause** to pause at the current playback position.
4. Select **Resume** to continue from that position.
5. Select **Stop** to cancel playback and reset the narration controls.

Katha asks the AI service to prepare the passage, then uses your browser's speech-synthesis voice to speak it. Narration may be unavailable if the browser does not support speech synthesis. Background music is separate and is not paused or stopped by narration controls.

## Choose global background music

1. Open **Settings** in the sidebar.
2. In **Background Music**, choose exactly one of:
   - **Rain Drip**
   - **40 Hz Binaural Beats**
   - **Cafe Ambience**
   - **Mute**
3. Adjust **Volume** independently with the slider.

The selected theme and volume are saved in this browser and continue across Katha pages and refreshes. Selecting **Mute** immediately silences the music. To comply with browser autoplay rules, a saved non-muted theme starts after you interact with the page; choosing a theme in Settings is itself an interaction. If audio is not supported or cannot start, Katha displays an error.

**Headphones are needed to perceive the separate left and right channels of the 40 Hz binaural option.** It uses two tones 40 Hz apart and is not a medical or therapeutic feature.

## Change appearance and account settings

In **Settings**:

- Choose **Light**, **Sepia**, or **Dark** to change the appearance. Your theme preference is saved in this browser.
- Choose a reading-mode preference using the **Reading mode** control.
- Use **Sign out** to end your current session on this browser.

The reader also has its own **Reading** and **Study with AI** buttons for switching between its normal PDF view and the study assistant.

## Troubleshooting

- **Incorrect credentials error:** Check that your email address and password are entered correctly. If you do not have an account yet, switch to **Create New User**. If your account email has not been verified yet, use the sign-in code option to complete verification.
- **Upload fails:** Confirm the file is a PDF and no larger than 50 MB. If it still fails, the storage service may be unavailable.
- **A book cannot be opened or removed:** Confirm you are signed into the account that owns it and try again. Katha does not use a storage path supplied by the browser to decide which PDF to delete.
- **A code or study notification does not arrive:** Check the email address and spam folder. Email delivery depends on the server's Resend configuration.
- **AI, translation, or narration preparation fails:** Ask the Katha administrator to check the backend OpenRouter configuration and provider limits. Do not enter API keys in the browser.
- **Translation is in the wrong language or not in Tamil script:** Check the selected target language and retry. Katha reports invalid Tamil-script output rather than displaying it as a successful Tamil translation.
- **Background music does not play:** Interact with the page, confirm that the selected theme is not **Mute**, and check the browser's audio settings. Use **Mute** in Settings to stop the music.
- **Narration does not play:** Confirm that the browser supports speech synthesis, then try **Narrate** again.

## Run Katha locally

Local development requires Node.js/npm, a configured Supabase project, backend environment variables, and the relevant email and AI provider configuration.

1. Copy `backend/.env.example` to `backend/.env`.
2. Set the backend's Supabase URL, Supabase service-role key, and a random `JWT_SECRET` with at least 32 characters. Configure Resend and OpenRouter credentials for email and AI functionality.
3. Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` to the backend API URL.
4. In a terminal, start the backend:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

5. In a second terminal, start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

6. Open the frontend URL printed by Vite in the terminal. The backend's default port is `8081`.

Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, and `JWT_SECRET` on the backend. Never place them in frontend environment variables or expose them in the browser.
