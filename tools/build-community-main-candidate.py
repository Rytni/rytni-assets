"""Prepare an additive MAIN candidate from its verified immutable base; never promote a manifest.

This intentionally does not promote the whole TEST bundle (which has unrelated game experiments).
The checked-in overlay block and exact existing MAIN release are the complete source inputs.
"""
import argparse,hashlib,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def build(root, output):
    root=Path(root)
    manifest=json.loads((root/'giveaway/manifest.json').read_text(encoding='utf-8'))
    base=manifest['current'];raw=(root/'giveaway'/base['file']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=base['sha256'] or len(raw)!=base['size']:raise ValueError('MAIN base hash mismatch')
    text=raw.decode('utf-8')
    if 'communityRankingMount' in text:raise ValueError('MAIN already includes community ranking')
    anchor='<div class="card span-2 rules-card" id="rules">'
    if text.count(anchor)!=1 or text.count('id="openRulesPopup"')!=1 or 'async function callSupabaseRpc(' not in text:raise ValueError('Unexpected MAIN source contract')
    source=(root/'tilda-test/blocks/10_T123_COMMUNITY_RANKING.html').read_text(encoding='utf-8')
    prepared=text.replace(anchor,'<div class="span-2" id="communityRankingMount" data-channel="main"></div>\n\n    '+anchor,1)
    hero='<button class="ghost-btn" type="button" id="openRulesPopup">Правила</button>'
    if prepared.count(hero)!=1:raise ValueError('Unknown MAIN hero markup')
    prepared=prepared.replace(hero,hero+'\n        <a class="ghost-btn" href="#community-rating">Рейтинг участников</a>',1)
    prepared+='\n'+source+'\n'
    content=prepared.encode('utf-8');digest=hashlib.sha256(content).hexdigest();release_id=base['version']+'-'+digest[:12]
    destination=Path(output)/release_id/'app.html'
    if destination.exists() and destination.read_bytes()!=content:raise ValueError('Immutable MAIN collision')
    destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(content)
    return {'status':'CANDIDATE_ONLY_NOT_PUBLISHED','base':base,'current':{'id':release_id,'version':base['version'],
        'loader_schema':base['loader_schema'],'file':f'releases/{release_id}/app.html','sha256':digest,'size':len(content)},
        'allowed_differences':['ranking mount','hero link','community block'],
        'overlay_sha256':hashlib.sha256(source.encode()).hexdigest()}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--report',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    result=build(ROOT,args.output);args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps({'status':result['status'],'id':result['current']['id']}))
