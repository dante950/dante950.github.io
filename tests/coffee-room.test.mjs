import test from 'node:test';
import assert from 'node:assert/strict';
import {TutorialRoom} from '../src/tutorial/scene.js';

test('talk requires an interactive room and a nearby character',()=>{
 const room=Object.create(TutorialRoom.prototype);room.interactive=true;
 room.player={x:380,y:450};assert.equal(room.nearest(),null);
 room.player={x:505,y:375};assert.equal(room.nearest(),'coffee');assert.equal(room.canTalk('minion'),false);
 room.player={x:690,y:410};assert.equal(room.nearest(),'minion');assert.equal(room.canTalk('coffee'),false);
 room.player={x:795,y:410};assert.equal(room.canTalk('minion'),true);
 room.player.x++;assert.equal(room.nearest(),null);
 room.interactive=false;room.player={x:505,y:375};assert.equal(room.nearest(),null);
});
