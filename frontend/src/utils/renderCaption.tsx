import { Link } from "react-router";
export function renderCaption(content: string) {
  // \p{L} khớp với bất kỳ ký tự chữ cái nào trong bất kỳ ngôn ngữ nào
  // \p{N} khớp với bất kỳ con số nào
  // Cần thêm flag 'u' ở cuối Regex
  const regex = /(#[\p{L}\p{N}_]+)/gu; 

  return content.split(regex).map((part, i) => {
    if (part.startsWith("#")) {
      const tag = part.slice(1);
      return (
        <Link key={i} className="font-semibold" to={`/search?tag=${tag}`}>
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}