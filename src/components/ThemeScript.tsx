// SSR 첫 페인트 시 localStorage 값으로 html[data-theme]을 즉시 세팅하는 인라인 스크립트
// 이렇게 하지 않으면 깜빡임(flash)이 발생한다
export function ThemeScript() {
  const code = `(function(){try{var k='zzzq.theme.v1';var v=localStorage.getItem(k);if(!v||['cute','digital','gaming'].indexOf(v)===-1)v='cute';document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','cute');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
