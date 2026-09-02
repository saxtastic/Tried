# The scanner, as a Shortcut

Build this once in the Shortcuts app. It takes about fifteen minutes and needs
no Mac, no Apple Developer account, and no App Store review. It produces the
same `manifest.json` a native app would produce, so nothing here is thrown away
when the app arrives.

## What it can and cannot do

Shortcuts reads the directory entry: name, extension, size, creation date, last
modified date, path. That is exactly what `mfile/manifest.schema.json` requires,
with one exception.

**Shortcuts has no hashing action.** There is no way to compute a SHA-256 of a
file in Shortcuts without a helper app. So the manifest arrives with no
`content_hash`, and `duplicate` comes back as **candidate** rather than
`duplicate` — matched on equal size and equal extension, which is a real signal
and not a verdict.

This is the degraded path the criteria file describes, working as designed. Two
audio takes at 48,910,000 bytes with the same extension are worth looking at.
They are not proof, and the report does not call them proof.

Duration, resolution, capture date and EXIF are all out of reach too — they live
inside the file, and the scan reads only the entry. `mfile/media.json` records
this for each kind rather than leaving it to be discovered.

## The shortcut

Name it **Scan for M**.

1. **Folder** — *Files → Get File from Folder*, or start from a Share Sheet
   input so you can run it from any folder's share menu.
   Set **Recursive** on. Uncheck *Show Document Picker* only once you have
   settled on a fixed folder.

2. **Repeat with Each** over the files. Inside the loop:

   - *Get Details of Files* → **Name** → set variable `n`
   - *Get Details of Files* → **File Extension** → set variable `x`
   - *Get Details of Files* → **File Size** → set variable `b`
   - *Get Details of Files* → **Last Modified Date** → set variable `t`
   - *Get Details of Files* → **File Path** → set variable `p`
   - *Dictionary* with these six keys, in this order:

     | Key | Value | Type |
     | --- | --- | --- |
     | `path` | `p` | Text |
     | `name` | `n` | Text |
     | `ext` | `x` | Text |
     | `bytes` | `b` | Number |
     | `mtime` | `t`, formatted **ISO 8601** | Text |
     | `store` | `iphone-local` | Text |

   - *Add to Variable* → `records`

   Format `t` with *Format Date → Custom → ISO 8601*. A locale-formatted date
   string is not a timestamp and the ordering of a version series depends on it.

3. **Dictionary** — the envelope:

   | Key | Value |
   | --- | --- |
   | `scanned_at` | Current Date, ISO 8601 |
   | `root` | the folder's path |
   | `store` | `iphone-local` |
   | `records` | the `records` variable |

4. **Get Contents of URL**
   - URL: `https://ayeyoty.co/mfile/manifest`
   - Method: **POST**
   - Headers: `Content-Type: application/json`, `X-MFile-Token: <your token>`
   - Request Body: **JSON** → the envelope dictionary

5. **Save File** — write the response to
   *On My iPhone → M → reports → report-<date>.json*, replacing nothing.

The token is the one you set with `npx wrangler secret put MFILE_TOKEN`. It
lives in the shortcut and in Cloudflare, and nowhere in this repository. Anyone
holding it can spend your Worker's compute, so treat it like a password and
rotate it by running the same command again.

## Running it on a schedule

*Shortcuts → Automation → Time of Day.* Since iOS 16.4 a time-of-day automation
can run without asking, so turn **Ask Before Running** off once you trust it.

Start with one folder and once a week. A scan that runs nightly over everything
produces a report nobody reads, which is the same as no scan.

## When you get the report back

It will withhold three of the four questions on the first run. That is correct
and it is the point:

- `duplicate` → **candidate**, because there is no hash
- `iterative` → **withheld**, because the stem rules are not confirmed
- `novel` → **withheld**, for the same reason
- `functional` → **withheld**, because no reference index exists

Answering the three questions in `mfile/questions/intake.json` turns two of
those into stated verdicts. The fourth needs the reference index, which is a
separate build.

## What it never does

The shortcut reads and posts. It has no move, rename, delete or trash action in
it, and it should not acquire one. The endpoint stores nothing — it computes the
report and forgets the manifest. If a future version of either starts keeping an
inventory, that is a different tool and it needs saying out loud.
