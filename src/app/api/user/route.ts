/**
 * Handles GET requests to /api/user.
 * Returns a JSON response with a sample user object containing a name.
 * @returns {Response} A Response object with JSON content: { user: { name: "name" } }
 */
export const GET = () => {
    return new Response(JSON.stringify(
        {
            user: {
                name: "name"
            }
        }
    ));
};