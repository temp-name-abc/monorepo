import Head from "next/head";
import { Header } from "./Header";
import { Instructions } from "./Instructions";
import { Plans } from "./Plans";
import { UseCases } from "./UseCases";

interface IProps {}

export function LandingPage({}: IProps) {
    return (
        <>
            <Head>
                <title>MonoStack - Don't search, just ask</title>
                <meta
                    name="description"
                    content="The number one platform powering natural language conversations with your data. Don't let your customers search for information, let them ask for it."
                />
                <link rel="shortcut icon" href="/images/favicon.ico" />
            </Head>
            <div className="space-y-10">
                <Header />
                <Instructions />
                <UseCases />
                <Plans />
            </div>
        </>
    );
}

export default LandingPage;
