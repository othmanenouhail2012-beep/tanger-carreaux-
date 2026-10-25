// Pure, client-side conversions between subtitle text formats (timestamps preserved).
export function vttToSrt(vtt: string): string {
  const blocks = vtt.replace(/\r/g, '').replace(/^WEBVTT[^\n]*\n+/, '').split(/\n\n+/)
    .filter((b) => b.includes('-->'));
  return blocks.map((b, i) => {
    const lines = b.split('\n');
    const at = lines.findIndex((l) => l.includes('-->'));
    const time = lines[at].replace(/(\d\d:\d\d)\.(\d{3})/g, '$1,$2').replace(/(^|\s)(\d\d:\d\d,\d{3})/g, '$100:$2').replace(/ (align|position|line|size):\S+/g, '');
    return `${i + 1}\n${time}\n${lines.slice(at + 1).join('\n')}`;
  }).join('\n\n') + '\n';
}
export function srtToVtt(srt: string): string {
  return 'WEBVTT\n\n' + srt.replace(/\r/g, '').replace(/(\d\d:\d\d:\d\d),(\d{3})/g, '$1.$2');
}
export function toText(srt: string): string {
  return srt.replace(/\r/g, '').split(/\n\n+/)
    .map((b) => b.split('\n').filter((l) => l && !/^\d+$/.test(l) && !l.includes('-->') && l !== 'WEBVTT').join(' '))
    .filter(Boolean).join('\n');
}
