# The scanner, as two Shortcuts

Build this once in the Shortcuts app. It takes about fifteen minutes and needs
no Mac, no Apple Developer account, and no App Store review. It produces the
same `manifest.json` a native app would produce, so nothing here is thrown away
when the app arrives.

There are two doors onto your media and they afford different things. Build
both; they post to the same endpoint and the administrator can tell them apart.

| | Files | Photos |
| --- | --- | --- |
| identity | path | asset id |
| size, name, extension | yes | yes |
| modified date | yes | yes |
| **capture date** | no | **yes** |
| **duration** | no | **yes** |
| **dimensions** | no | **yes** |
| **album membership** | no | **yes** |
| favourite | no | yes |
| people / faces | no | **no** |
| covers | anything you grant | camera roll only |

## What the Files door can and cannot do

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

Duration, resolution and capture date are out of reach **through this door** —
they live inside the file, and the folder scan reads only the entry. They are
not out of reach absolutely: the Photos door hands them over, which is most of
the reason to build it. `mfile/media.json` records what each kind hides from the
folder scan, and `mfile/doors.json` records the asymmetry.

## The shortcut

Name it **Scan Files for M**.

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

## The second shortcut: Photos

Name it **Scan Photos for M**. It is shorter, because *Get Details of Images*
does most of the work.

1. **Text** — the albums you want, one per line. Not "all photos": a library of
   forty thousand assets returns a report nobody reads. Start with the three you
   would actually pull a media kit from.

2. **Split Text** by New Lines, then **Repeat with Each** album. Inside:

   - *Find Photos* → **Album is** `Repeat Item`. Leave the limit off at first
     and add one if the run gets slow.
   - *Repeat with Each* photo. Inside that:
     - *Get Details of Images* → **Name**, **File Extension**, **File Size**,
       **Date Taken**, **Last Modified Date**, **Width**, **Height**,
       **Duration**, **Is Favorite**, and **Media Identifier**
     - *Dictionary*:

       | Key | Value | Type |
       | --- | --- | --- |
       | `path` | `photos://` + album + `/` + name | Text |
       | `name` | Name | Text |
       | `ext` | File Extension, lowercased | Text |
       | `bytes` | File Size | Number |
       | `mtime` | Last Modified Date, ISO 8601 | Text |
       | `captured_at` | **Date Taken**, ISO 8601 | Text |
       | `asset_id` | **Media Identifier** | Text |
       | `album` | the album | Text |
       | `width` / `height` | Width / Height | Number |
       | `duration` | Duration, if any | Number |
       | `favorite` | Is Favorite | Boolean |
       | `store` | `photos` | Text |

     - *Add to Variable* → `records`

3. Envelope and POST exactly as the Files shortcut, with `store` set to
   `photos`.

**The two fields that matter most are `asset_id` and `captured_at`, and it is
worth being fussy about both.**

`asset_id` is the identity. One photo in three albums comes back three times
with one identifier, and the administrator collapses those into one file and
keeps the album list. If the id is missing they arrive as three separate files
with equal sizes — which reads as duplicates, and duplicates are the thing
people delete. There is only ever one file there.

`captured_at` is the better date and it changes verdicts. A pair shot in 2019
and 2021 but written to the phone in the opposite order gets **opposite heads**
depending on which date orders them, and the head is the one people keep. Where
capture date is present the report orders by it and says so.

## What neither door gives you

**People and faces.** PhotoKit does not expose the People index to third-party
apps, and Shortcuts does not either. "Every photo of X" has to come from an
album you maintain by hand. That is a platform limit, not something to route
around, and any plan that assumes otherwise needs rewriting rather than
retrying.

## Running them on a schedule

*Shortcuts → Automation → Time of Day.* Since iOS 16.4 a time-of-day automation
can run without asking, so turn **Ask Before Running** off once you trust it.

Start with one folder, three albums, once a week. A scan that runs nightly over
everything produces a report nobody reads, which is the same as no scan.

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

Both shortcuts read and post. Neither has a move, rename, delete or trash action
in it, and neither should acquire one — least of all the Photos one, where the
delete action empties into Recently Deleted and takes the asset out of every
album at once. The endpoint stores nothing — it computes the
report and forgets the manifest. If a future version of either starts keeping an
inventory, that is a different tool and it needs saying out loud.
