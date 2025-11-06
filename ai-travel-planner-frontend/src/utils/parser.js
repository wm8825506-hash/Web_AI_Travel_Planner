export function parseTravelInput(text) {
  const result = {
    destination: "",
    days: "",
    budget: "",
    people: "",
    preferences: ""
  };

  // 目的地
  const destMatch = text.match(/去([^\s,，。]+)(?:玩|旅游|旅行)?/);
  if (destMatch) result.destination = destMatch[1];

  // 天数
  const daysMatch = text.match(/(\d+)\s*天/);
  if (daysMatch) result.days = parseInt(daysMatch[1]);

  // 预算
  const budgetMatch = text.match(/(预算|花费|大概)(\d+\.?\d*)/);
  if (budgetMatch) result.budget = budgetMatch[2];

  // 同行人数
  const peopleMatch = text.match(/(带|和|一共)(\d+)(个人|人)/);
  if (peopleMatch) result.people = parseInt(peopleMatch[2]);
  else if (text.includes("带孩子")) result.people = "家庭出行";

  // 偏好
  const prefsMatch = text.match(/(喜欢|想去看|主要想)([^。，“”]*)/);
  if (prefsMatch) result.preferences = prefsMatch[2].replace(/和|、|，/g, " ").trim();

  return result;
}
