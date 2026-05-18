const text = 'hai đầu xương dài';
const escapedAnchor = 'u xương'.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// OLD logic
const oldRegex = new RegExp(`(?<![<\\w])(?<!\/)(?<!")(${escapedAnchor})(?![^<]*>)`, 'i');
console.log('Old matching "u xương" in "hai đầu xương dài"?', oldRegex.test(text));

// NEW logic
const newRegex = new RegExp(`(?<![<\\w\\p{L}\\p{M}])(?<!\/)(?<!")(${escapedAnchor})(?![\\w\\p{L}\\p{M}])(?![^<]*>)`, 'iu');
console.log('New matching "u xương" in "hai đầu xương dài"?', newRegex.test(text));

const escapedAnchor2 = 'đầu xương';
const newRegex2 = new RegExp(`(?<![<\\w\\p{L}\\p{M}])(?<!\/)(?<!")(${escapedAnchor2})(?![\\w\\p{L}\\p{M}])(?![^<]*>)`, 'iu');
console.log('New matching "đầu xương" in "hai đầu xương dài"?', newRegex2.test(text));
