export default function EmptyTableRow({
  colSpan,
  message,
  className = "px-4 py-14 text-center text-slate-400",
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={className}>
        <div className="mx-auto max-w-sm">
          <div className="text-sm font-semibold text-slate-500">{message}</div>
        </div>
      </td>
    </tr>
  );
}
