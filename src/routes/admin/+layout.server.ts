import { redirect } from '@sveltejs/kit';
import { ADMIN_EMAIL } from '$env/static/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {

    // User is not logged in
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    // User is logged in but is not the admin
    if (locals.user.email !== ADMIN_EMAIL) {
        throw redirect(303, '/');
    }

    // User is authenticated and is the admin
    return {};
};