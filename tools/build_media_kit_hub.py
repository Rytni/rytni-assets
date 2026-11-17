"""Build only the Media Kit hub from allowlisted existing public aggregates."""
import base64
import hashlib
import html
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'media-kits/hub'
BASE='https://rytni.github.io/rytni-assets/'


def logo(platform):
    suffix='ico' if platform=='instagram' else 'png'
    raw=(FOLDER/'brands'/f'{platform}.{suffix}').read_bytes()
    mime='image/x-icon' if suffix=='ico' else 'image/png'
    return f'<img class="platform-logo" src="data:{mime};base64,{base64.b64encode(raw).decode()}" alt="{dict(tiktok="TikTok",youtube="YouTube",instagram="Instagram")[platform]}" width="34" height="34">'


def aggregate(key,config):
    prefix='data/media-kits/' if config['platform']=='tiktok' else 'data/platform-media/'
    m=json.loads((ROOT/prefix/key/'manifest.json').read_bytes())
    if config['platform']=='tiktok':
        sha=m['release_sha256'];file=prefix+key+'/releases/'+sha+'.json'
        assert m['schema_version']==3 and (m['account_key'],m['username'],m['media_kit_slug'])==(key,config['handle'],config['slug'])
        assert m['release_id']==sha and m['release_url']==BASE+file
    else:
        sha=m['release']['sha256'];file=prefix+key+'/releases/'+sha+'.json'
        assert m['platform']==key and m['release']['file']==file
    assert len(sha)==64 and all(c in '0123456789abcdef' for c in sha)
    raw=(ROOT/file).read_bytes();assert hashlib.sha256(raw).hexdigest()==sha
    v=json.loads(raw)
    if config['platform']=='tiktok':
        assert v['schema_version']==2
        assert (v['account_key'],v['username'],v['media_kit_slug'])==(key,config['handle'],config['slug'])
        p=v['period'];current=v['current']['followers']
        return dict(followers=current['value'],followersAsOf=current['as_of_date'],views=p['metrics']['views']['value'],start=p['period_start'],end=p['period_end'],capturedAt=p['captured_at'],timezone=p['source_timezone'])
    assert len(raw)==m['release']['size'] and v['platform']==key
    for account in (m['account'],v['account']):assert (account['handle'],account['platform_id'],account['url'])==(config['handle'],config['platformId'],config['profile'])
    metrics={row['key']:row for row in v['metrics']};assert metrics['followers']['scope']=='CURRENT' and metrics['views']['scope']=='PERIOD'
    return dict(followers=metrics['followers']['value'],followersAsOf=v['captured_at'][:10],views=metrics['views']['value'],start=v['period']['start'],end=v['period']['end'],capturedAt=v['captured_at'],timezone=v['period']['timezone'])


def tr(ru,en,tag='span',cls=''):
    return f'<{tag} class="{cls}" data-ru="{html.escape(ru,quote=True)}" data-en="{html.escape(en,quote=True)}">{html.escape(ru)}</{tag}>'


def main():
    content=json.loads((FOLDER/'content.json').read_bytes());rows={key:aggregate(key,c) for key,c in content.items()}
    cards=[]
    for key,c in content.items():
        v=rows[key];assert all(type(v[m]) is int and 0<=v[m]<=10**15 for m in ('followers','views'))
        date=lambda value:value[8:10]+'.'+value[5:7]+'.'+value[:4]
        num=lambda value:f'{value:,}'.replace(',',' ')
        compact=lambda value:(f'{value/1_000_000:.1f}'.replace('.',',')+' млн') if value>=1_000_000 else (f'{value/1000:.1f}'.rstrip('0').rstrip('.').replace('.',',')+' тыс.') if value>=1000 else str(value)
        cards.append(f'''<article class="channel-card" data-key="{key}" data-platform="{c['platform']}" data-data-state="SAVED"><div class="card-kicker"><span class="platform-name">{logo(c['platform'])}{c['platformLabel']}</span>{tr(c['topic'],c['topicEn'],'span','topic-label')}</div>{tr(c['title'],c['titleEn'],'h3')}<p class="channel-handle">@{c['handle']}</p>{tr(c['description'],c['descriptionEn'],'p','channel-description')}<div class="channel-tags">{''.join(tr(a,b) for a,b in zip(c['tags'],c['tagsEn']))}</div><div class="card-metrics"><div><strong data-stat="followers" data-value="{v['followers']}" title="{num(v['followers'])}" aria-label="{num(v['followers'])}">{num(v['followers'])}</strong>{tr('Подписчики','Subscribers' if key=='youtube' else 'Followers','span','metric-label')}<span class="metric-date" data-asof>на {date(v['followersAsOf'])}</span></div><div><strong data-stat="views" data-value="{v['views']}" title="{num(v['views'])}" aria-label="{num(v['views'])}">{compact(v['views'])}</strong>{tr('Просмотры за период','Period views','span','metric-label')}<span class="metric-date" data-period>{date(v['start'])} — {date(v['end'])}{' · UTC' if v['timezone']=='UTC' else ''}</span></div></div><div class="card-actions"><a class="card-primary" href="https://rytni.live/{c['slug']}">{tr('Открыть медиакит','Open media kit')}<span aria-hidden="true">↗</span></a><a class="card-profile" href="{c['profile']}" target="_blank" rel="noopener">{tr('Профиль ↗','Profile ↗')}</a></div></article>''')
    cfg={'config':content,'accounts':rows}
    text=(FOLDER/'page.html').read_text(encoding='utf-8')
    for token,value in {'CSS':(FOLDER/'styles.css').read_text(encoding='utf-8'),'CARDS':''.join(cards),'BOOTSTRAP':json.dumps(cfg,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'),'JS':(FOLDER/'runtime.js').read_text(encoding='utf-8'),'TIKTOK':logo('tiktok'),'YOUTUBE':logo('youtube'),'INSTAGRAM':logo('instagram')}.items():
        text=text.replace('@@'+token+'@@',value)
    assert '@@' not in text
    (FOLDER/'index.html').write_text(text,encoding='utf-8')
    print(json.dumps({'built':'media-kits/hub/index.html','bytes':len(text.encode()),'channels':len(rows),'sha256':hashlib.sha256(text.encode()).hexdigest()}))


if __name__=='__main__':main()
