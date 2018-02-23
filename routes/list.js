const { Router } = require('express');
const _ = require('lodash');

const { findAll, getVersions } = require('../lib/store');

const router = Router();

// https://www.terraform.io/docs/registry/api.html#search-modules
router.get('/search', async (req, res) => {
  if (!req.query.q) {
    return res.status(400).render('error', {
      message: 'q parameter required.',
    });
  }

  // `q` search in `name` field.
  // It could be extended to other fields. Specification said it depends on registry implementation.
  const options = {
    ...req.query,
    selector: {
      name: {
        $regex: new RegExp(req.query.q),
      },
    },
    q: null,
  };

  if (req.params.namespace) {
    options.namespace = req.params.namespace;
  }

  const modules = await findAll(options);
  return res.render('modules/list', modules);
});

// https://www.terraform.io/docs/registry/api.html#list-modules
router.get(['/', '/:namespace'], async (req, res) => {
  const options = {
    ...req.query,
  };
  if (req.params.namespace) {
    options.namespace = req.params.namespace;
  }

  const modules = await findAll(options);
  res.render('modules/list', modules);
});

// https://www.terraform.io/docs/registry/api.html#list-available-versions-for-a-specific-module
router.get('/:namespace/:name/:provider/versions', async (req, res, next) => {
  const options = {
    ...req.params,
  };

  try {
    const versions = await getVersions(options);
    res.render('modules/versions', {
      source: `${req.params.namespace}/${req.params.name}/${req.params.provider}`,
      versions,
    });
  } catch (e) {
    next(e);
  }
});

// https://www.terraform.io/docs/registry/api.html#list-latest-version-of-module-for-all-providers
router.get('/:namespace/:name', async (req, res) => {
  const options = {
    offset: 0,
    // FIXME: to support for too many modules
    limt: 100,
    selector: {
      namespace: { $eq: req.params.namespace },
      name: { $eq: req.params.name },
    },
  };

  const result = await findAll(options);
  const grouped = _.groupBy(result.modules, m => `${m.namespace}/${m.name}/${m.provider}`);

  const modules = Object.keys(grouped).map((key) => {
    const sorted = _.orderBy(grouped[key], ['versions']);
    return sorted[sorted.length - 1];
  });

  res.render('modules/list', {
    meta: {},
    modules,
  });
});

module.exports = router;
