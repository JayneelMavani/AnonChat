export const GET = () => {
    return new Response(JSON.stringify(
        {
            user: {
                name: "name"
            }
        }
    ));
};