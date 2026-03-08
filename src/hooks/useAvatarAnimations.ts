import { useState, useCallback, useRef, useEffect } from 'react';

export type AvatarAction =
  // Movement
  | 'idle' | 'dance' | 'spin' | 'backflip' | 'frontflip' | 'sideflip'
  | 'jump' | 'hop' | 'bounce' | 'float' | 'fly' | 'dive' | 'fall'
  | 'lean_left' | 'lean_right' | 'lean_forward' | 'lean_back'
  | 'sway' | 'wobble' | 'zigzag' | 'orbit' | 'figure_eight'
  // Dance styles
  | 'breakdance' | 'robot_dance' | 'moonwalk' | 'disco' | 'salsa'
  | 'floss' | 'dab' | 'macarena' | 'twist' | 'headbang'
  | 'shuffle' | 'twerk' | 'waltz' | 'ballet' | 'hiphop'
  // Expressions
  | 'wave' | 'wave_both' | 'clap' | 'thumbs_up' | 'peace_sign'
  | 'fist_pump' | 'shrug' | 'flex' | 'point' | 'salute'
  | 'bow' | 'curtsy' | 'nod' | 'shake_head' | 'facepalm'
  | 'think' | 'excited' | 'surprised' | 'angry' | 'sad'
  | 'happy' | 'confused' | 'sleepy' | 'dizzy' | 'love'
  | 'laugh' | 'cry' | 'blush' | 'wink' | 'eye_roll'
  // Effects
  | 'explode' | 'implode' | 'glitch' | 'teleport' | 'dissolve'
  | 'grow' | 'shrink' | 'stretch' | 'squash' | 'inflate'
  | 'deflate' | 'vibrate' | 'earthquake' | 'shiver' | 'melt'
  | 'freeze' | 'electrocute' | 'power_up' | 'power_down' | 'charge'
  | 'shield' | 'invisibility' | 'hologram' | 'rainbow' | 'sparkle'
  | 'fire' | 'ice' | 'lightning' | 'wind' | 'tornado'
  // Tricks
  | 'cartwheel' | 'handstand' | 'pushup' | 'situp' | 'jumping_jack'
  | 'karate_kick' | 'punch' | 'uppercut' | 'hadouken' | 'kamehameha'
  | 'super_saiyan' | 'naruto_run' | 't_pose' | 'a_pose' | 'splits'
  | 'helicopter' | 'barrel_roll' | 'corkscrew' | 'matrix_dodge' | 'moonjump';

const ALL_ACTIONS: AvatarAction[] = [
  'idle','dance','spin','backflip','frontflip','sideflip','jump','hop','bounce','float',
  'fly','dive','fall','lean_left','lean_right','lean_forward','lean_back','sway','wobble',
  'zigzag','orbit','figure_eight','breakdance','robot_dance','moonwalk','disco','salsa',
  'floss','dab','macarena','twist','headbang','shuffle','twerk','waltz','ballet','hiphop',
  'wave','wave_both','clap','thumbs_up','peace_sign','fist_pump','shrug','flex','point',
  'salute','bow','curtsy','nod','shake_head','facepalm','think','excited','surprised',
  'angry','sad','happy','confused','sleepy','dizzy','love','laugh','cry','blush','wink',
  'eye_roll','explode','implode','glitch','teleport','dissolve','grow','shrink','stretch',
  'squash','inflate','deflate','vibrate','earthquake','shiver','melt','freeze','electrocute',
  'power_up','power_down','charge','shield','invisibility','hologram','rainbow','sparkle',
  'fire','ice','lightning','wind','tornado','cartwheel','handstand','pushup','situp',
  'jumping_jack','karate_kick','punch','uppercut','hadouken','kamehameha','super_saiyan',
  'naruto_run','t_pose','a_pose','splits','helicopter','barrel_roll','corkscrew',
  'matrix_dodge','moonjump',
];

// Map of keyword patterns → actions
const ACTION_PATTERNS: [RegExp, AvatarAction][] = ALL_ACTIONS
  .filter(a => a !== 'idle')
  .map(action => {
    const words = action.replace(/_/g, '[_ ]?');
    return [new RegExp(`\\b${words}\\b`, 'i'), action] as [RegExp, AvatarAction];
  });

// Additional natural language mappings
const EXTRA_PATTERNS: [RegExp, AvatarAction][] = [
  [/\bdanc(e|ing)\b/i, 'dance'],
  [/\bspinn?(ing)?\b/i, 'spin'],
  [/\bexplod(e|ing)\b/i, 'explode'],
  [/\bback\s?flip\b/i, 'backflip'],
  [/\bfront\s?flip\b/i, 'frontflip'],
  [/\bside\s?flip\b/i, 'sideflip'],
  [/\bjump(ing)?\b/i, 'jump'],
  [/\bbounc(e|ing)\b/i, 'bounce'],
  [/\bflipp?(ing)?\b/i, 'backflip'],
  [/\bwav(e|ing)\b/i, 'wave'],
  [/\bclap(ping)?\b/i, 'clap'],
  [/\bthumbs?\s?up\b/i, 'thumbs_up'],
  [/\bshrug(ging)?\b/i, 'shrug'],
  [/\bbowing?\b/i, 'bow'],
  [/\bnod(ding)?\b/i, 'nod'],
  [/\bshak(e|ing)\s?(my\s)?head\b/i, 'shake_head'],
  [/\bthink(ing)?\b/i, 'think'],
  [/\bexcited\b/i, 'excited'],
  [/\bsurpris(e|ed)\b/i, 'surprised'],
  [/\bangr(y|ily)\b/i, 'angry'],
  [/\bsad(ly)?\b/i, 'sad'],
  [/\bhapp(y|ily)\b/i, 'happy'],
  [/\bconfus(e|ed|ing)\b/i, 'confused'],
  [/\bsleep(y|ing)\b/i, 'sleepy'],
  [/\bdizz(y|ily)\b/i, 'dizzy'],
  [/\blove\b/i, 'love'],
  [/\blaugh(ing)?\b/i, 'laugh'],
  [/\bcry(ing)?\b/i, 'cry'],
  [/\bwink(ing)?\b/i, 'wink'],
  [/\bglitch(ing|y)?\b/i, 'glitch'],
  [/\bteleport(ing)?\b/i, 'teleport'],
  [/\bgrow(ing)?\b/i, 'grow'],
  [/\bshrink(ing)?\b/i, 'shrink'],
  [/\bvibrat(e|ing)\b/i, 'vibrate'],
  [/\bshiver(ing)?\b/i, 'shiver'],
  [/\bmelt(ing)?\b/i, 'melt'],
  [/\bfreez(e|ing)\b/i, 'freeze'],
  [/\bpower\s?up\b/i, 'power_up'],
  [/\bcharge\b|charging\b/i, 'charge'],
  [/\brainbow\b/i, 'rainbow'],
  [/\bsparkl(e|ing)\b/i, 'sparkle'],
  [/\bfire\b|burning\b/i, 'fire'],
  [/\bkarate\b/i, 'karate_kick'],
  [/\bpunch(ing)?\b/i, 'punch'],
  [/\bhadouken\b/i, 'hadouken'],
  [/\bkamehameha\b/i, 'kamehameha'],
  [/\bsuper\s?saiyan\b/i, 'super_saiyan'],
  [/\bnaruto\b/i, 'naruto_run'],
  [/\bt[\s-]?pose\b/i, 't_pose'],
  [/\bbarrel\s?roll\b/i, 'barrel_roll'],
  [/\bmatrix\b/i, 'matrix_dodge'],
  [/\bhelicopter\b/i, 'helicopter'],
  [/\bpush\s?up/i, 'pushup'],
  [/\bjumping\s?jack/i, 'jumping_jack'],
  [/\bcartwheel/i, 'cartwheel'],
  [/\bhandstand/i, 'handstand'],
  [/\bhead\s?bang/i, 'headbang'],
  [/\bfloss(ing)?\b/i, 'floss'],
  [/\bdab(bing)?\b/i, 'dab'],
  [/\bdisco\b/i, 'disco'],
  [/\bbreak\s?danc/i, 'breakdance'],
  [/\bmoonwalk/i, 'moonwalk'],
  [/\brobot\s?danc/i, 'robot_dance'],
  [/\bballerina|ballet\b/i, 'ballet'],
  [/\btwerk/i, 'twerk'],
  [/\bsalut(e|ing)\b/i, 'salute'],
  [/\bflex(ing)?\b/i, 'flex'],
  [/\bfist\s?pump/i, 'fist_pump'],
  [/\bpeace\b/i, 'peace_sign'],
  [/\bpoint(ing)?\b/i, 'point'],
  [/\bcurtsy\b/i, 'curtsy'],
  [/\bfacepalm\b/i, 'facepalm'],
  [/\beye\s?roll\b/i, 'eye_roll'],
  [/\bimplod/i, 'implode'],
  [/\bdissolv/i, 'dissolve'],
  [/\bstretch/i, 'stretch'],
  [/\bsquash/i, 'squash'],
  [/\binflat/i, 'inflate'],
  [/\bdeflat/i, 'deflate'],
  [/\bearthquake/i, 'earthquake'],
  [/\belectrocut/i, 'electrocute'],
  [/\bshield\b/i, 'shield'],
  [/\binvisib/i, 'invisibility'],
  [/\bhologram/i, 'hologram'],
  [/\blightning|thunder\b/i, 'lightning'],
  [/\bwind\b|windy\b/i, 'wind'],
  [/\btornado\b/i, 'tornado'],
  [/\bice\b|frozen\b/i, 'ice'],
  [/\buppercut/i, 'uppercut'],
  [/\bcorkscrew/i, 'corkscrew'],
  [/\bsplit(s)?\b/i, 'splits'],
  [/\bmoon\s?jump/i, 'moonjump'],
  [/\bsit\s?up/i, 'situp'],
  [/\bblush/i, 'blush'],
];

export function detectAction(text: string): AvatarAction | null {
  // Check extra patterns first (more specific)
  for (const [re, action] of EXTRA_PATTERNS) {
    if (re.test(text)) return action;
  }
  // Then action name patterns
  for (const [re, action] of ACTION_PATTERNS) {
    if (re.test(text)) return action;
  }
  return null;
}

// Duration for each animation in seconds
function getActionDuration(action: AvatarAction): number {
  const long: AvatarAction[] = ['dance','breakdance','robot_dance','disco','salsa','floss','macarena','waltz','ballet','hiphop','shuffle','twist','headbang','moonwalk','twerk','super_saiyan','kamehameha','tornado','helicopter'];
  const medium: AvatarAction[] = ['spin','backflip','frontflip','sideflip','cartwheel','barrel_roll','corkscrew','explode','implode','glitch','teleport','dissolve','power_up','charge','rainbow','hadouken','matrix_dodge','jumping_jack','pushup','situp','handstand'];
  if (long.includes(action)) return 4;
  if (medium.includes(action)) return 2.5;
  return 1.8;
}

export interface AnimationState {
  action: AvatarAction;
  progress: number; // 0-1
  startTime: number;
  duration: number;
}

export function useAvatarAnimations() {
  const [currentAction, setCurrentAction] = useState<AvatarAction>('idle');
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<{ action: AvatarAction; start: number; duration: number } | null>(null);
  const rafRef = useRef(0);

  const triggerAction = useCallback((action: AvatarAction) => {
    if (action === 'idle') {
      animRef.current = null;
      setCurrentAction('idle');
      setAnimProgress(0);
      return;
    }
    const duration = getActionDuration(action);
    animRef.current = { action, start: Date.now() / 1000, duration };
    setCurrentAction(action);
  }, []);

  useEffect(() => {
    const tick = () => {
      const a = animRef.current;
      if (a) {
        const elapsed = Date.now() / 1000 - a.start;
        const p = Math.min(1, elapsed / a.duration);
        setAnimProgress(p);
        if (p >= 1) {
          animRef.current = null;
          setCurrentAction('idle');
          setAnimProgress(0);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { currentAction, animProgress, triggerAction, detectAction };
}

/** Returns transform modifiers for the avatar based on current action + progress */
export function getActionTransforms(action: AvatarAction, p: number, t: number) {
  const ease = (x: number) => x < 0.5 ? 2*x*x : 1-(-2*x+2)**2/2; // easeInOutQuad
  const ep = ease(p);
  const bounce = Math.sin(p * Math.PI);
  const shake = Math.sin(p * Math.PI * 8);

  let bodyX = 0, bodyY = 0, bodyRotate = 0, bodyScale = 1;
  let headExtra = 0, headTiltExtra = 0;
  let armLMod = 0, armRMod = 0; // arm angle modifiers
  let eyeMod = 1; // eye scale multiplier
  let opacity = 1;
  let hueShift = 0;
  let glitchX = 0, glitchY = 0;
  let flameBoost = 0;

  switch (action) {
    // === MOVEMENT ===
    case 'dance': bodyY = Math.sin(t*8)*10; bodyX = Math.sin(t*4)*8; armLMod = Math.sin(t*8)*60; armRMod = Math.sin(t*8+2)*60; break;
    case 'spin': bodyRotate = p * 720; break;
    case 'backflip': bodyRotate = -bounce * 360; bodyY = -bounce * 60; flameBoost = bounce; break;
    case 'frontflip': bodyRotate = bounce * 360; bodyY = -bounce * 50; flameBoost = bounce; break;
    case 'sideflip': bodyRotate = bounce * 360; bodyX = Math.sin(p*Math.PI)*30; bodyY = -bounce*40; break;
    case 'jump': bodyY = -bounce * 80; flameBoost = bounce; armLMod = -bounce*40; armRMod = -bounce*40; break;
    case 'hop': bodyY = -Math.abs(Math.sin(p*Math.PI*4))*30; flameBoost = 0.5; break;
    case 'bounce': bodyY = Math.sin(p*Math.PI*6)*20; bodyScale = 1+Math.sin(p*Math.PI*6)*0.05; break;
    case 'float': bodyY = Math.sin(t*2)*15-10; flameBoost = 0.6; break;
    case 'fly': bodyY = -ep*80; bodyRotate = Math.sin(t*3)*5; flameBoost = 1; armLMod = -45; armRMod = -45; break;
    case 'dive': bodyY = ep*60; bodyRotate = 15; armLMod = 180; armRMod = 180; break;
    case 'fall': bodyY = ep*100; bodyRotate = shake*10; break;
    case 'lean_left': bodyRotate = -bounce*15; bodyX = -bounce*10; break;
    case 'lean_right': bodyRotate = bounce*15; bodyX = bounce*10; break;
    case 'lean_forward': bodyScale = 1+bounce*0.1; headExtra = bounce*8; break;
    case 'lean_back': bodyScale = 1-bounce*0.05; headExtra = -bounce*8; break;
    case 'sway': bodyX = Math.sin(t*3)*15; bodyRotate = Math.sin(t*3)*5; break;
    case 'wobble': bodyRotate = Math.sin(t*10)*8*(1-p); break;
    case 'zigzag': bodyX = Math.sin(p*Math.PI*8)*20; bodyY = -p*20; break;
    case 'orbit': bodyX = Math.cos(p*Math.PI*4)*30; bodyY = Math.sin(p*Math.PI*4)*15; break;
    case 'figure_eight': bodyX = Math.sin(p*Math.PI*4)*25; bodyY = Math.sin(p*Math.PI*2)*15; break;

    // === DANCE STYLES ===
    case 'breakdance': bodyRotate = p*1080; bodyY = Math.sin(t*6)*8; armLMod = t*200; armRMod = -t*200; break;
    case 'robot_dance': { const snap = Math.floor(t*4)%4; bodyRotate = [0,10,-10,0][snap]; armLMod = [0,-90,0,90][snap]; armRMod = [90,0,-90,0][snap]; break; }
    case 'moonwalk': bodyX = Math.sin(t*2)*20-ep*30; break;
    case 'disco': bodyY = Math.sin(t*8)*8; armLMod = Math.sin(t*4)*90+45; armRMod = Math.cos(t*4)*90+45; hueShift = t*120; break;
    case 'salsa': bodyX = Math.sin(t*6)*12; bodyRotate = Math.sin(t*3)*8; armLMod = Math.sin(t*6)*40; armRMod = Math.sin(t*6+1)*40; break;
    case 'floss': armLMod = Math.sin(t*8)*90; armRMod = Math.sin(t*8+Math.PI)*90; bodyX = Math.sin(t*8)*5; break;
    case 'dab': armLMod = -135; armRMod = 45; headTiltExtra = -20; bodyRotate = -10; break;
    case 'macarena': { const phase = (t*2)%4; armLMod = phase<1?-90:phase<2?-90:phase<3?0:0; armRMod = phase<1?0:phase<2?-90:phase<3?-90:0; bodyX = phase>3?Math.sin(t*6)*10:0; break; }
    case 'twist': bodyRotate = Math.sin(t*6)*20; bodyY = Math.sin(t*3)*5; break;
    case 'headbang': headExtra = Math.sin(t*10)*15; break;
    case 'shuffle': bodyX = Math.sin(t*6)*15; bodyY = Math.abs(Math.sin(t*6))*-10; break;
    case 'twerk': bodyRotate = Math.sin(t*10)*5; bodyY = Math.sin(t*10)*5; break;
    case 'waltz': bodyX = Math.sin(t*3)*20; bodyY = Math.cos(t*3)*10; bodyRotate = Math.sin(t*3)*5; break;
    case 'ballet': bodyY = -bounce*30; armLMod = -150; armRMod = -150; bodyRotate = p*360; break;
    case 'hiphop': bodyY = Math.sin(t*6)*10; bodyX = Math.sin(t*3)*8; armLMod = Math.sin(t*6)*70; armRMod = Math.cos(t*6)*70; break;

    // === EXPRESSIONS ===
    case 'wave': armRMod = -90+Math.sin(t*6)*20; break;
    case 'wave_both': armLMod = -90+Math.sin(t*6)*20; armRMod = -90+Math.sin(t*6+1)*20; break;
    case 'clap': armLMod = -60+Math.sin(t*10)*20; armRMod = -60+Math.sin(t*10)*20; break;
    case 'thumbs_up': armRMod = -120; break;
    case 'peace_sign': armRMod = -130; break;
    case 'fist_pump': armRMod = -90+Math.sin(t*6)*40; bodyY = Math.sin(t*6)*5; break;
    case 'shrug': armLMod = -60; armRMod = -60; bodyY = bounce*5; break;
    case 'flex': armLMod = -90; armRMod = -90; bodyScale = 1+bounce*0.08; break;
    case 'point': armRMod = -90; break;
    case 'salute': armRMod = -140; headTiltExtra = 3; break;
    case 'bow': bodyRotate = bounce*20; headExtra = bounce*15; break;
    case 'curtsy': bodyRotate = bounce*8; bodyY = bounce*10; break;
    case 'nod': headExtra = Math.sin(t*6)*10; break;
    case 'shake_head': headTiltExtra = Math.sin(t*8)*12; break;
    case 'facepalm': armRMod = -150; headTiltExtra = 10; break;
    case 'think': armRMod = -120; headTiltExtra = 8; break;
    case 'excited': bodyY = Math.sin(t*10)*10; armLMod = Math.sin(t*10)*60-30; armRMod = Math.sin(t*10+1)*60-30; eyeMod = 1.3; break;
    case 'surprised': eyeMod = 1.5; bodyY = -bounce*10; break;
    case 'angry': bodyScale = 1+bounce*0.05; headTiltExtra = -5; eyeMod = 0.7; break;
    case 'sad': bodyY = bounce*8; headExtra = bounce*10; eyeMod = 0.8; break;
    case 'happy': bodyY = Math.sin(t*6)*8; eyeMod = 1.2; armLMod = Math.sin(t*3)*30; armRMod = Math.sin(t*3+1)*30; break;
    case 'confused': headTiltExtra = Math.sin(t*2)*15; eyeMod = 1.1; break;
    case 'sleepy': eyeMod = 0.3; headExtra = bounce*12; bodyY = bounce*5; break;
    case 'dizzy': bodyRotate = Math.sin(t*4)*15; headTiltExtra = Math.sin(t*6)*10; eyeMod = 0.8; break;
    case 'love': eyeMod = 1.3; bodyY = Math.sin(t*3)*5; hueShift = 320; break;
    case 'laugh': bodyY = Math.sin(t*10)*6; headTiltExtra = Math.sin(t*5)*5; eyeMod = 0.9; break;
    case 'cry': headExtra = bounce*10; eyeMod = 0.6; break;
    case 'blush': hueShift = 340; eyeMod = 0.9; break;
    case 'wink': break; // handled in avatar via action name
    case 'eye_roll': break; // handled in avatar

    // === EFFECTS ===
    case 'explode': bodyScale = 1+ep*3; opacity = 1-ep; break;
    case 'implode': bodyScale = 1-ep*0.8; opacity = 1-ep*0.5; break;
    case 'glitch': glitchX = shake*15*(1-p); glitchY = Math.cos(p*Math.PI*12)*8*(1-p); break;
    case 'teleport': opacity = p<0.3?1-p*3:p>0.7?((p-0.7)/0.3):0; bodyY = p<0.3?0:p>0.7?0:-200; break;
    case 'dissolve': opacity = 1-ep; bodyY = -ep*20; break;
    case 'grow': bodyScale = 1+bounce*0.4; break;
    case 'shrink': bodyScale = 1-bounce*0.4; break;
    case 'stretch': bodyScale = 1+bounce*0.15; break;
    case 'squash': bodyScale = 1-bounce*0.15; break;
    case 'inflate': bodyScale = 1+ep*0.5; break;
    case 'deflate': bodyScale = 1-bounce*0.3; break;
    case 'vibrate': glitchX = shake*6; glitchY = Math.cos(p*Math.PI*16)*3; break;
    case 'earthquake': glitchX = shake*10; glitchY = Math.cos(p*Math.PI*10)*8; bodyRotate = shake*3; break;
    case 'shiver': glitchX = Math.sin(t*20)*3*(1-p); break;
    case 'melt': bodyY = ep*40; bodyScale = 1-ep*0.3; break;
    case 'freeze': bodyScale = 1; hueShift = 200; break; // blue tint
    case 'electrocute': glitchX = shake*12; glitchY = Math.cos(p*40)*6; hueShift = 60; break;
    case 'power_up': bodyScale = 1+bounce*0.15; flameBoost = bounce; hueShift = bounce*60; break;
    case 'power_down': bodyScale = 1-ep*0.1; opacity = 1-ep*0.3; break;
    case 'charge': bodyScale = 1+ep*0.1; flameBoost = ep; break;
    case 'shield': bodyScale = 1+bounce*0.05; break; // shield ring handled in avatar
    case 'invisibility': opacity = 1-bounce*0.7; break;
    case 'hologram': opacity = 0.5+Math.sin(t*10)*0.3; glitchY = Math.sin(t*20)*2; break;
    case 'rainbow': hueShift = t*180; break;
    case 'sparkle': break; // particles handled in avatar
    case 'fire': hueShift = 20; flameBoost = 1; break;
    case 'ice': hueShift = 200; break;
    case 'lightning': glitchX = Math.random()>0.7?shake*20:0; hueShift = 60; break;
    case 'wind': bodyX = Math.sin(t*3)*15; bodyRotate = Math.sin(t*3)*8; break;
    case 'tornado': bodyRotate = p*1440; bodyY = -bounce*40; bodyX = Math.sin(p*20)*15; break;

    // === TRICKS ===
    case 'cartwheel': bodyRotate = p*360; bodyX = (p-0.5)*60; break;
    case 'handstand': bodyRotate = bounce*180; bodyY = -bounce*20; armLMod = 180; armRMod = 180; break;
    case 'pushup': bodyRotate = Math.sin(t*4)*15; headExtra = Math.sin(t*4)*8; break;
    case 'situp': bodyRotate = Math.sin(t*3)*25; break;
    case 'jumping_jack': armLMod = Math.sin(t*6)*90-45; armRMod = Math.sin(t*6)*90-45; bodyY = Math.abs(Math.sin(t*6))*-15; break;
    case 'karate_kick': bodyRotate = bounce*-20; armLMod = -45; break;
    case 'punch': armRMod = -90; bodyRotate = bounce*-10; bodyX = bounce*10; break;
    case 'uppercut': armRMod = -160; bodyY = -bounce*20; break;
    case 'hadouken': armLMod = -90; armRMod = -90; bodyScale = 1+bounce*0.1; flameBoost = bounce; hueShift = 200; break;
    case 'kamehameha': armLMod = -60; armRMod = -60; bodyScale = 1+ep*0.2; flameBoost = ep; hueShift = 220; break;
    case 'super_saiyan': bodyScale = 1+bounce*0.15; flameBoost = 1; hueShift = 50; armLMod = -30; armRMod = -30; bodyY = -bounce*10; break;
    case 'naruto_run': bodyRotate = -15; armLMod = 140; armRMod = 140; bodyX = (ep-0.5)*40; break;
    case 't_pose': armLMod = -90; armRMod = -90; break;
    case 'a_pose': armLMod = -45; armRMod = -45; break;
    case 'splits': bodyY = bounce*30; break;
    case 'helicopter': bodyRotate = p*2160; bodyY = -bounce*50; armLMod = -90; armRMod = -90; flameBoost = bounce; break;
    case 'barrel_roll': bodyRotate = p*360; bodyX = Math.sin(p*Math.PI)*30; break;
    case 'corkscrew': bodyRotate = p*720; bodyY = -bounce*60; bodyX = Math.sin(p*Math.PI*2)*20; flameBoost = bounce; break;
    case 'matrix_dodge': bodyRotate = bounce*-30; headExtra = -bounce*15; bodyY = bounce*10; break;
    case 'moonjump': bodyY = -bounce*120; flameBoost = bounce; armLMod = -bounce*30; armRMod = -bounce*30; break;
    default: break;
  }

  return { bodyX: bodyX+glitchX, bodyY: bodyY+glitchY, bodyRotate, bodyScale, headExtra, headTiltExtra, armLMod, armRMod, eyeMod, opacity, hueShift, flameBoost };
}
