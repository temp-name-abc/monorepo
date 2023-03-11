interface IProps {
    text: string;
}

export function TextChunk({ text }: IProps) {
    return (
        <>
            {text
                .trim()
                .split(/\n|\\n/)
                .map((elem, i) => (
                    <p className="py-1" key={i}>
                        {elem}
                    </p>
                ))}
        </>
    );
}

export default TextChunk;
