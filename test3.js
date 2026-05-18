const anchor = 'u xương';
const testText = 'hai đầu xương dài';
const testTextNFD = testText.normalize('NFD');
const eAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rg = new RegExp('(^|\\s|[.,;!?()"\'])(' + eAnchor + ')($|\\s|[.,;!?()"\'])', 'gi');
console.log('Match UI NFC?', rg.test(testText));
rg.lastIndex = 0;
console.log('Match UI NFD?', rg.test(testTextNFD));

const rg2 = new RegExp('(?<![<\\p{L}\\p{M}\\d_])(?<!\/)(?<!")(' + eAnchor + ')(?![\\p{L}\\p{M}\\d_])(?![^<]*>)', 'iu');
console.log('Match NEW NFC?', rg2.test(testText));
rg2.lastIndex = 0;
console.log('Match NEW NFD?', rg2.test(testTextNFD));
