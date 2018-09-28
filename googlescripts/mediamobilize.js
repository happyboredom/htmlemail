function onOpen() {
  SpreadsheetApp.getUi()
  .createMenu('Generate')
  .addItem("Generate Media Mobilize Ad", 'openDialog')
  .addItem("Generate Module", 'openModule')
  .addItem("Fetch Section", 'openFetchSection')
  .addToUi();
}

function doGet() {
  return HtmlService
  .createHtmlOutputFromFile('preview')
  .evaluate();
}

function openDialog() {
  var html = HtmlService
  .createTemplateFromFile('preview')
  .evaluate();
  SpreadsheetApp
  .getUi()
  .showModalDialog(html, 'Output');
}

function openModule() {
  var html = HtmlService
  .createTemplateFromFile('module')
  .evaluate();
  SpreadsheetApp
  .getUi()
  .showModalDialog(html, 'Output');
}


function link_(link, text) {
  var html = '<a href="__link__" style="__style__">__text__</a>';
  // var sm = '{{smartlink(web_url=__link__, **utm)}}';
  var style = 'Margin-bottom:12px;color:#000000;text-decoration:none;display:block;'
  return html
  .replace('__link__', link)
  .replace('__text__', text)
  .replace('__style__', style);
}

function promoted_(data) {
  var text = 'PROMOTED BY __promo__';
  return [
    {
      'hr':'t',
      'hr_color':'#f52828',
      'height':2,
      'space':10
    },
    {
      'text':text.replace('__promo__', data['text']),
      'style':'font-family:Arial, sans-serif; font-size:12px;color:#f52828;text-transform:uppercase;text-align:left;letter-spacing:1px;',
      'space':34,
      'space_class':'h30'
    }
  ];
}

function clean(text) {
  return text.replace('\n', '').trim();
}

function headline_(data) {
  var text = clean(data['text']);
  return [
    {
    'text':link_(data['link'], text),
    'style':'font-size:27px;line-height:33px;font-family:Georgia, Times, serif;font-weight:bold;',
    'line_class':'article_title font21'
    }
  ];
}

function image_(data) {
  return [
    {
      'text':data['text'],
      'image':data['image'],
      'height':Math.floor(800 * 566 / 1200),
      'width':Math.floor(1200 * 566 / 1200),
      'image_class':'imageScale',
      'web_url':data['link'],
      'space':'16',
      'space_class':'h10',
      'align':'center'
    }
  ];
}

function body_(data) {
  var body = data['text'];
  var stylediv = 'font-size:17px;font-family: Georgia, serif;text-align:left;line-height:26px;Margin-bottom:15px;';
  var stylea = 'text-decoration:none;color:#000000;';
  var styleDomain = 'font-family:Helvetica, Arial, sans-serif; font-weight:bold;';
  var cssClass = 'font14 paddingbottom20';
  var domain = data['domain'] || '';
  var tmpl = '<div class="__class__">' + 
    '<a class="article_text_link" href="{{smartlink(web_url=\'__link__\', **utm)}}" style="__stylea__">' +
      '<span class="article_author" style="__styleDomain__">__domain__</span> ' +
        '<span class="article_text">__body__</a>';

  var output = tmpl
  .replace('__body__', clean(data['text']))
  .replace('__class__', cssClass)
  .replace('__link__', data['link'])
  .replace('__stylea__', stylea)
  .replace('__styleDomain__', styleDomain)
  .replace('__domain__', data['domain']);
  return [
    {
      'text':output,
      'space':'10',
      'space_class':'h10',
      'style':stylediv,
      'line_class':cssClass
    }
  ];
}

function convertToConfig(data, index) {
  var template = "body.{index}.{key} = {value}\n";
  var output = "";
  for (var key in data) {
    var value = data[key];
    output += template
    .replace('{index}', (index+1)*10)
    .replace('{key}', key)
    .replace('{value}', value);
  }
  output += "\n";
  return output;
}


function parseUgly() {
  var sheet = SpreadsheetApp.getActive();
  var selection = sheet.getSelection();
  var range = selection.getActiveRange();
  var data = range.getValues();
  var mapper = {};
  for (var i=0; i<data.length; i++) {
    var row = data[i];
    var key = row[0].toLowerCase().replace(':','').replace(' ','');
    var val = clean(row[1]);
    mapper[key] = val;
  }
  var promoted = promoted_({'text':data[0][0]});
  var headline = headline_({'link':mapper['link'], 'text':mapper['headline']});
  var image = image_({'link':mapper['link'], 'image':mapper['image'], 'text':data[0][0]});
  var body = body_({'link':mapper['link'], 'text':mapper['body'], 'domain':mapper['domain']});
  var module = promoted.concat(headline, image, body);
  var final = "body.default_padding = 42\n" + 
    "body.default_padding_class = w10" +
      "\n\n";
  final += module.map(convertToConfig).join('\n');
  return final;
}


function convertToSheetToModule(setup, line) {
  var temp = {};
  for (var i=1;i<setup.length;i++) {
    var key=setup[i];
    var val=line[i];
    if (val != undefined && val != '' && val != null) {
      temp[key] = val;
    }
  }
  return temp;
}

function parseModule() {
  var range = SpreadsheetApp.getActive().getActiveSheet().getDataRange();
  var data = range.getValues();
  var setup = data[0];
  var data = data.splice(1,data.length);
  var output = "body.default_padding = 42\n" + 
    "body.default_padding_class = w10\n" +
      "\n\n";
  var config = [];
  for (var i=0;i<data.length;i++) {
    var line = data[i];
    config.push(convertToSheetToModule(setup, line));
  }
  //return JSON.stringify(config, undefined, 2);
  var final = "body.default_padding = 42\n" + 
    "body.default_padding_class = w10\n" +
      "body.default_style = font-family:Arial, sans-serif;" +
      "\n\n";
  final += config.map(convertToConfig).join('\n');
  return final;
}


/*
items.1.title = Silence on Wall Street.
items.1.author_display_name = By Lori Rozsa
items.1.author = By Lori Rozsa
items.1.web_url = https://www.washingtonpost.com/
items.1.item_url = https://www.washingtonpost.com/
items.1.section_url = flipboard://showSection/resolve%2Fflipboard%2Furl%252Fhttps%253A%252F%252Fwww.washingtonpost.com%252Fpolitics%252Fsilence-on-wall-street-tears-in-a-retirement-home-the-country-watches-transfixed-as-ford-tells-her-story%252F2018%252F09%252F27%252F09de532a-c261-11e8-97a5-ab1e46bb3bc7_story.html?back=flipboard/curator%2Fmagazine%2Foatw0j5SRMm6x60FIwotoA%3Am%3A3153968
items.1.excerpt = ...
items.1.image.width = 550
items.1.section_id = flipboard/curator%2Fmagazine%2Foatw0j5SRMm6x60FIwotoA%3Am%3A3153968
items.1.domain = washingtonpost.com
items.1.bottomlinespace = 0
items.1.bottomlineheight = 1
items.1.bottomlinecolor = #cccccc
items.1.line_after_block = 1
items.1.space_after_block = 1
# largeURL
items.1.image.url = https://d1i4t8bqe7zgj6.cloudfront.net/09-27-2018/t_6bac42c03d394a77911e2c9135a75a46_name_KAVANAUGH_050.jpg
items.1.image.original_width = 1920
items.1.image.original_height = 1080
*/

function openFetchSection() {
  var html = HtmlService
  .createTemplateFromFile('articles')
  .evaluate();
  SpreadsheetApp
  .getUi()
  .showModalDialog(html, 'Output');
}

function doFetchSection() {
  var sheet = SpreadsheetApp.getActive();
  var selection = sheet.getActiveCell();
  var sectionid = selection.getValue();
  var section = new ArticleGrabber(sectionid);
  var module_config = {
    'section_id':sectionid,
    'module.skip_flap':'t',
    'wrap.width':650,
    'wrap.padding':40,
    'heading':'',
    'teaser':'',
    'module.bottom.space':0,
    'line_after_block':0,
    'space_after_block':1,
    'module.social_share':1,
    'hide_plus':0,
    'hide_topics':1,
    'hide_ago':1,
    'cache':true    
  }
  var foo = section.convertToPlainConfig(module_config, 0);
  var stories = section.data.join('\n');
  return foo + '\n\n' + stories;
}

function ArticleGrabber(sectionid) {
  this.sectionid = sectionid;
  var json = this.fetchSection(sectionid);
  this.data = json['stream']
  .filter(function (obj) { return obj['type'] == 'post'; })
  .map(this.generateSectionArticles, this)
  .map(this.decorateItems, this)
  .map(this.convertToArticleConfig, this);
  return this;
}

ArticleGrabber.prototype.fetchSection = function (sectionid) {
  var url = 'https://flapi.flipboard.com/content/v1/sections?limit=10&remoteid=' + encodeURIComponent(sectionid);
  var response = UrlFetchApp.fetch(url);
  var data = response.getContentText();
  return JSON.parse(data);
};

ArticleGrabber.prototype.getImages = function(item) {
  var inlineImage = item['inlineImage'];
  var inlineItems = item['inlineItems'];
  var imageurl = inlineImage['mediumURL'] || inlineImage['largeURL'] || inlineImage['xlargeURL'];
  Logger.log(imageurl);
  return {
    'url':imageurl,
    'width':inlineImage['original_width'],
    'height':inlineImage['original_height']
  };
};

ArticleGrabber.prototype.generateSectionArticles = function(item, index) {
  var image = this.getImages(item);
  return {
    'title':item['title'],
    'excerpt':item['excerptText'],
    'domain':item['sourceDomain'],
    'author': item['authorDisplayName'],
    'author_display_name':item['authorDisplayName'],
    'web_url':item['sourceURL'],
    'item_url':item['sourceURL'],
    'section_id':item['sectionID'],
    'image.url':image['url'],
    'image.width':550,
    'image.original_width':image['width'],
    'image.original_height':image['height']
  }
};

ArticleGrabber.prototype.decorateItems = function(item, index) {
  var decorative = {
    'bottomlinespace':0,
    'bottomlineheight':1,
    'bottomlinecolor':'#cccccc',
    'line_after_block':1,
    'space_after_block':1
  };
  return extend(item, decorative);
};

ArticleGrabber.prototype.convertToArticleConfig = function(data, index) {
  var template = "items.{index}.{key} = {value}\n";
  var output = "";
  for (var key in data) {
    var value = data[key];
    output += template
    .replace('{index}', (index+1))
    .replace('{key}', key)
    .replace('{value}', value);
  }
  output += "\n\n";
  return output;  
}

ArticleGrabber.prototype.convertToPlainConfig = function (data, index) {
  var template = "{key} = {value}\n";
  var output = "";
  for (var key in data) {
    var value = data[key];
    output += template
    .replace('{index}', (index+1))
    .replace('{key}', key)
    .replace('{value}', value);
  }
  output += "\n";
  return output;  
}


function extend(obj, src) {
    Object.keys(src).forEach(function(key) { obj[key] = src[key]; });
    return obj;
}
  
function culturistGuestHeader() {
  var top = 'bg.outer = #000000'
  + '\n' + 'body.default_padding = 0' 
  + '\n' + 'body.default_padding_class = w10'
  + '\n' + 'body.default_style=  font-size:15px;line-height:21px;color:#262626;'
  + '\n' + 'wrap.padding = 0';
  var body = [
    {
      'space':'5',
      'space_class':'h10',
    },
    {
      'text':output,
      'line_class':'blackHeaderTopWide',
      'image_2col':'t',
      'col1_width':405,
      'col2_width':0,
      'col3_width':0,
      'left_sub_lines':[
        {
          'image':'https://cdn.flipboard.com/email/assets/bracket-topleft-black2.png',
          'image_class':'blackBracket mobileOnly',
          'style':'',
          'height':20,
          'width':20,
          'padding':0
        },
        {
          'image':'http://cdn.flipboard.com/email/assets/bracket-topleft.png',
          'image_class':'blackBracket desktopOnly',
          'style':'',
          'height':25,
          'width':25,
          'padding':0
        },
        {
          'space':0,
          'space_class':'dh13',
        }
      ],
      'right_sub_lines':[]
    }
  ];
}


