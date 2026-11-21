# Kinetic

[Watch the video pitch](https://youtu.be/fdrY9zwF-6Q)

Kinetic is an interactive project planning simulator built for the Teens Hack Houston 2026 Business Track. Explore a fictional creative agency’s client website launch by selecting stages on an orbital map and adjusting Development staffing.

![Kinetic baseline with one developer and a day 19 forecast](https://github.com/user-attachments/assets/3ddbc9fe-3fec-4610-8bc1-895dd9067168)

![Kinetic staffing comparison showing day 19 versus day 13](https://github.com/user-attachments/assets/edf47982-c020-4111-905e-a8ba130d384e)

## Run locally

From the repository root, start the preview with Node.js. No package installation is required.

```sh
node serve.cjs
```

Open [the local preview](http://127.0.0.1:4174/). Select a planet to inspect its work, choose one or two developers to compare finish estimates, and use **Reset simulation** to restore the opening view.

## Simulated scenario

The client deadline is day 15. Design takes four days to approve layouts. Development then builds the site and sets up the CMS, each requiring six developer-days. Launch takes three days for final QA and release once both tasks finish.

| Staffing | Development schedule | Project finish |
| --- | --- | --- |
| One developer | 12 days in sequence | Day 19, four days late |
| Two developers | Six days in parallel | Day 13, two days early |

Both scenarios assign 12 developer-days of work. The parallel scenario assumes two full-time developers can work independently after layout approval.
