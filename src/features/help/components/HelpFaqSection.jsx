export default function HelpFaqSection({ faqItems, showTitle = true }) {
  return (
    <section className="helpBlock">
      {showTitle ? <h2 className="cardH2">FAQ</h2> : null}
      <ul className="helpList">
        {faqItems.map((item) => (
          <li key={item.question}>
            <strong>{item.question}</strong> {item.answer}
          </li>
        ))}
      </ul>
    </section>
  )
}
