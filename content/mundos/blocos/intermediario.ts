// Listas de blocos e ajudantes compartilhados por várias lições.

export const FLAG = "event_whenflagclicked";
export const IFS = ["control_if", "control_if_else"];

export const CONTROLE = [
  FLAG, "event_whenkeypressed", "event_whenthisspriteclicked", "motion_movesteps", "motion_ifonedgebounce", "motion_changexby", "motion_changeyby", "motion_gotoxy",
  "motion_pointindirection", "motion_setrotationstyle", "looks_say", "looks_sayforsecs", "looks_nextcostume", "sound_play",
  "control_wait", "control_repeat", "control_forever", "control_if", "control_if_else", "sensing_keypressed", "sensing_touchingobject",
];

export const SENSORES = [
  ...CONTROLE, "motion_pointtowards", "motion_goto", "control_stop", "sensing_distanceto", "sensing_mousex", "sensing_mousey",
  "sensing_mousedown", "sensing_timer", "sensing_resettimer", "operator_lt", "operator_gt", "operator_equals", "operator_round", "operator_join",
];
