// ============================================================
// DAILY DOOR-KNOCK FEED
// Fetches posts from Reddit, HN, Dev.to, and X (via Google)
// Writes results to Google Sheet
// ============================================================

// ── STEP 1: EDIT THESE BEFORE RUNNING ────────────────────────
var GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';   // From Google Cloud Console
var GOOGLE_CX     = 'YOUR_SEARCH_ENGINE_ID';  // From Programmable Search Engine
var SHEET_NAME    = 'Daily Feed';
// ─────────────────────────────────────────────────────────────

var KEYWORDS = [
  'vibe coding',
  'cursor help',
  'lovable help',
  'bolt.new',
  'project management solo',
  'too many projects',
  'built with AI',
  'no code help',
  'notion alternative',
];

var SUBREDDITS = [
  'vibecoding',
  'nocode',
  'SideProject',
  'solopreneur',
  'learnprogramming',
  'indiehackers',
  'freelance',
];

var HN_QUERIES = [
  'vibe coding',
  'AI coding help',
  'project management solopreneur',
  'cursor AI problem',
  'lovable app',
];

var DEVTO_TAGS = ['vibecoding', 'nocode', 'buildinpublic', 'solopreneur'];

var X_QUERIES = [
  '"vibe coding"',
  '"cursor help"',
  '"lovable help"',
  '"bolt.new"',
  '"too many apps"',
  '"notion alternative"',
  '"building in public"',
];

// ── MAIN — this runs daily ────────────────────────────────────
function fetchDailyFeed() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = ['Date', 'Platform', 'Source', 'Title', 'URL', 'Author', 'Score'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#222222').setFontColor('#00ff41');
    sheet.setFrozenRows(1);
  }

  var today   = new Date().toLocaleDateString();
  var results = [];

  results = results.concat(fetchReddit(today));
  results = results.concat(fetchHN(today));
  results = results.concat(fetchDevTo(today));

  if (GOOGLE_API_KEY !== 'YOUR_GOOGLE_API_KEY') {
    results = results.concat(fetchX(today));
  } else {
    Logger.log('X skipped — add your GOOGLE_API_KEY and GOOGLE_CX to enable it.');
  }

  if (results.length > 0) {
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, results.length, 7).setValues(results);
  }

  Logger.log('Done. ' + results.length + ' posts fetched.');
}

// ── REDDIT ────────────────────────────────────────────────────
function fetchReddit(today) {
  var results = [];

  SUBREDDITS.forEach(function(sub) {
    try {
      var url      = 'https://www.reddit.com/r/' + sub + '/new.json?limit=25';
      var response = UrlFetchApp.fetch(url, {
        headers: { 'User-Agent': 'GoogleAppsScript/DailyFeed' },
        muteHttpExceptions: true,
      });

      if (response.getResponseCode() !== 200) return;

      var posts = JSON.parse(response.getContentText()).data.children;

      posts.forEach(function(post) {
        var title   = post.data.title.toLowerCase();
        var matches = KEYWORDS.some(function(kw) { return title.indexOf(kw.toLowerCase()) !== -1; });

        if (sub === 'vibecoding' || matches) {
          results.push([
            today,
            'Reddit',
            'r/' + sub,
            post.data.title,
            'https://reddit.com' + post.data.permalink,
            'u/' + post.data.author,
            post.data.score,
          ]);
        }
      });

      Utilities.sleep(1000);
    } catch (e) {
      Logger.log('Reddit r/' + sub + ' error: ' + e.message);
    }
  });

  return results;
}

// ── HACKER NEWS ───────────────────────────────────────────────
function fetchHN(today) {
  var results    = [];
  var since      = Math.floor((Date.now() - 86400000) / 1000); // last 24h

  HN_QUERIES.forEach(function(query) {
    try {
      var url = 'https://hn.algolia.com/api/v1/search?query=' +
        encodeURIComponent(query) +
        '&tags=(story,ask_hn)&hitsPerPage=5&numericFilters=created_at_i>' + since;

      var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) return;

      var hits = JSON.parse(response.getContentText()).hits;

      hits.forEach(function(hit) {
        if (!hit.title) return;
        results.push([
          today,
          'Hacker News',
          'Ask HN / Story',
          hit.title,
          hit.url || 'https://news.ycombinator.com/item?id=' + hit.objectID,
          hit.author,
          hit.points || 0,
        ]);
      });

      Utilities.sleep(500);
    } catch (e) {
      Logger.log('HN error: ' + e.message);
    }
  });

  return results;
}

// ── DEV.TO ────────────────────────────────────────────────────
function fetchDevTo(today) {
  var results = [];

  DEVTO_TAGS.forEach(function(tag) {
    try {
      var url      = 'https://dev.to/api/articles?tag=' + tag + '&per_page=10&top=1';
      var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) return;

      var articles = JSON.parse(response.getContentText());

      articles.forEach(function(a) {
        results.push([
          today,
          'Dev.to',
          '#' + tag,
          a.title,
          a.url,
          a.user.username,
          a.positive_reactions_count,
        ]);
      });

      Utilities.sleep(500);
    } catch (e) {
      Logger.log('Dev.to error: ' + e.message);
    }
  });

  return results;
}

// ── X VIA GOOGLE CUSTOM SEARCH ────────────────────────────────
function fetchX(today) {
  var results = [];

  X_QUERIES.forEach(function(query) {
    try {
      var url = 'https://www.googleapis.com/customsearch/v1' +
        '?key=' + GOOGLE_API_KEY +
        '&cx=' + GOOGLE_CX +
        '&q=site:x.com ' + encodeURIComponent(query) +
        '&dateRestrict=d1&num=5';

      var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) return;

      var items = JSON.parse(response.getContentText()).items;
      if (!items) return;

      items.forEach(function(item) {
        results.push([
          today,
          'X (Twitter)',
          query,
          item.title,
          item.link,
          '',
          0,
        ]);
      });

      Utilities.sleep(500);
    } catch (e) {
      Logger.log('X error: ' + e.message);
    }
  });

  return results;
}

