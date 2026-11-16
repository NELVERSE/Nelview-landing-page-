// @ts-nocheck
// Page script for index.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function(){
var tour=document.getElementById('tour'),order=['review','edit','journal','cite','format'],cur=0,timer=null;
function show(t){cur=order.indexOf(t);document.querySelectorAll('#tourTabs button').forEach(function(b){var on=b.getAttribute('data-t')===t;b.classList.remove('on');if(on){void b.offsetWidth;b.classList.add('on');}});document.querySelectorAll('#tourSide .it[data-t]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-t')===t);});tour.querySelectorAll('.tpane').forEach(function(p){p.classList.toggle('on',p.getAttribute('data-t')===t);});}
function auto(){clearInterval(timer);timer=setInterval(function(){show(order[(cur+1)%order.length]);},7000);}
function pick(t){clearInterval(timer);tour.classList.add('paused');show(t);}
document.querySelectorAll('#tourTabs button,#tourSide .it[data-t]').forEach(function(b){b.addEventListener('click',function(){pick(b.getAttribute('data-t'));});});
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)auto();else tour.classList.add('paused');
})();
