
n onOpen() {
  SpreadsheetApp.getUi()
  .createMenu('Generate')
  .addItem("Generate Ad", 'openDialog')
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

function headline_(data) {
  return [
    {
    'text':link_(data['link'], data['text']),
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
      'height':'',
      'width':566,
      'image_class':'imageScale',
      'web_url':data['link'],
      'space':'10',
      'space_class':'h10',
      'align':'center'
    }
  ];
}

function body_(data) {
  var body = data['text'];
  var stylediv = 'color:#070707;text-align:left;line-height:26px;Margin-bottom:15px;';
  var stylea = 'text-decoration: none; font-size:17px; color:#000000;';
  var class = 'font14 paddingbottom20';
  var domain = data['domain'] || '';
  var tmpl = '<div style="__stylediv__" class="__class__">' + 
    '<a class="article_text_link" href="{{smartlink(web_url=\'__link__\', **utm)}}" style="__stylea__">' +
      '<span class="article_author" style="font-family: Helvetica, Arial, sans-serif; font-weight:bold;">__domain__</span> ' +
        '<span class="article_text" style="font-family: Georgia, Helvetica, Arial, sans-serif;">__body__</a>';
  //'web_url':data['link'],
  return [
    {
      'text':data['text'],
      'space':'10',
      'space_class':'h10',
      'style':''
    }
  ];
}

function parseUgly() {
  var sheet = SpreadsheetApp.getActive();
  var selection = sheet.getSelection();
  var range = selection.getActiveRange();
  var data = range.getValues();
  var output = "";
  var mapper = {};
  for (var i=0; i<data.length; i++) {
    var row = data[i];
    var key = row[0].toLowerCase().replace(':','').replace(' ','');
    var val = row[1];
    mapper[key] = val;
  }
  var promoted = promoted_({'text':data[0][0]});
  var headline = headline_({'link':mapper['link'], 'text':mapper['headline']});
  var image = image_({'link':mapper['link'], 'image':mapper['image'], 'text':data[0][0]});
  var body = body_({'link':mapper['link'], 'text':mapper['body']});
  var module = promoted.concat(headline, image, body);
  return JSON.stringify(module, undefined, 3);
}
