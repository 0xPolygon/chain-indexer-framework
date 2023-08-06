export default {
    querystring: {
        type: 'object',
        properties: {
            userAddress: {
                type: 'string',
                nullable: true
            },
            page: {
                type: 'string',
                nullable: true
            },
            pageSize: {
                type: 'string',
                nullable: true
            }
        }
    }
}
