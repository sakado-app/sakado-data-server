/*
 *  Sakado, an app for school
 *  Copyright (C) 2017 Adrien 'Litarvan' Navratil
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const status = ['success', 'failed', 'error', 'internalError', 'malformed'];

function response(status, id, response)
{
    if (response === undefined)
    {
        response = {};
    }

    response['status'] = status;

    if (id !== undefined)
    {
        response['id'] = id;
    }

    return JSON.stringify(response) + "\n";
}

status.forEach(status => module.exports[status] = (id, r) => response(status, id, r));