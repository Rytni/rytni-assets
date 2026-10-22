// Static, safe captions: no private points or user-provided HTML.
export function restoredNotificationText(kind,payload={}){
 if(kind==='sponsor_chest')return '🎁 <b>Сундук от спонсора снова доступен</b>\n\nЗаберите бонус и продолжите прокачку заявки в Rytni Подари.';
 if(kind!=='arcade_fly'&&kind!=='arcade_snake')return null;
 const game=kind==='arcade_fly'?'Mushroom Fly':'Mushroom Snake';
 return payload.opportunity==='sponsor'
  ? `🎮 <b>${game}: снова доступна попытка от спонсора</b>\n\nЛимит восстановился. Откройте Аркаду и получите бонусную попытку кнопкой «Попытка от спонсора».`
  : `🎮 <b>${game}: новая попытка уже доступна</b>\n\nОбычная рейтинговая попытка восстановилась. Откройте Аркаду и попробуйте улучшить свой рекорд!`;
}
export function restoredMediaKind(kind){
 return kind==='sponsor_chest'?'chest':kind==='arcade_fly'||kind==='arcade_snake'?'question':kind;
}
