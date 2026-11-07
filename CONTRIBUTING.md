# Contributing

Edit canonical skills, not generated plugin copies. Keep each skill narrowly scoped and
self-contained. Include useful examples, explicit limitations and source links for factual
claims. Use synthetic learner data only. Do not contribute private exams, student records,
or copyrighted teaching material you lack permission to distribute.

Before a pull request:

```sh
python3 scripts/build_bundles.py
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
```

For website changes, also run `npm test`, `npm run build` and `npm run test:e2e` in `website/`.
Explain what behavior changed, what was checked, and what remains unverified. Adding an
evaluation prompt is not proof that a model passed it. Changes affecting grading, privacy,
source accuracy or assessment boundaries need explicit scenario review.
