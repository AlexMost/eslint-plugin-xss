
'use strict';

var tree = module.exports = {

    /**
     * Gets the identifier from the node.
     *
     * @param {Node} node - Node to get the identifier for.
     *
     * @returns {Identifier} - The identifier node.
     */
    getIdentifier: function( node ) {

        // Function calls use the callee as name.
        if( node.type === 'CallExpression' )
            node = node.callee;

        // Get the member property.
        if( node.type === 'MemberExpression' ) {
            if( node.computed )
                node = node.object;
            else
                node = node.property;
        }

        if( node.type !== 'Identifier' )
            return null;

        return node;
    },

    /**
     * Gets the name of the node.
     *
     * @param {Node} node - The node to get the name for.
     *
     * @returns {string} Node name.
     */
    getNodeName: function( node ) {

        // Check the 'this' expression.
        if( node.type === 'ThisExpression' )
            return 'this';

        // Expect identifier or similar node.
        var id = tree.getIdentifier( node );
        return id ? id.name : '';
    },

    /**
     * Gets the function name.
     *
     * @param {Node} func - Function node.
     *
     * @returns {string} Function name with optional '.' for member functions.
     */
    getFullItemName: function( func ) {

        // Unwrap the possible call expression.
        if( func.type === 'CallExpression' )
            func = func.callee;

        // Resolve the name stack from the member expression.
        // This gathers it in reverse.
        var name = [];
        while( func.type === 'MemberExpression' ) {
            name.push( func.property.name );
            func = func.object;
        }

        // Ensure the last object name is an identifier at this point.
        // We don't support [] indexed access for encoders.
        if( func.type === 'Identifier' )
            name.push( func.name );

        // Reverse the stack to get it in correct order and join functio names
        // using '.'
        name.reverse();
        name = name.join( '.' );

        return name;
    },

    /**
     * Gets the function name.
     *
     * @param {Node} func - Function node.
     *
     * @returns {string} Function name with optional '.' for member functions.
     */
    getPartialItemName: function( func ) {

        // Unwrap the possible call expression.
        if( func.type === 'CallExpression' )
            func = func.callee;

        // Unwrap the member expressions and get the last identifier.
        var isMember = func.type === 'MemberExpression';
        var node = tree.getIdentifier( func );
        if( !node ) return;

        return ( isMember ? '.' : '' ) + node.name;
    },

    /**
     * Gets the parent function identifier.
     *
     * @param {Node} node - Node for which to get the parent function.
     *
     * @returns {Identifier} - The function identifier or null.
     */
    getParentFunctionIdentifier: function( node ) {

        // We'll want to get the closest function.
        var func = node;
        while( func &&
            func.type !== 'FunctionExpression' &&
            func.type !== 'FunctionDeclaration' &&
            func.type !== 'ArrowFunctionExpression' ) {

            // Continue getting the parent.
            func = func.parent;
        }

        // If the function is named, return the function name.
        if( func.id )
            return func.id;

        // Otherwise see if it is being assigned to a variable.
        var parent = func.parent;
        if( parent && parent.type === 'VariableDeclarator' )
            return parent.id;
        if( parent && parent.type === 'AssignmentExpression' )
            return parent.left;

        return null;
    },

    /**
     * Checks whether the node is part of the parameters of the expression.
     *
     * @param {Node} node - Node to check.
     * @param {Expression} expr - The expression we are interested in.
     *
     * @returns {bool} True, if the node is a parameter.
     */
    isParameter: function( node, expr ) {

        if( expr.type === 'CallExpression' ) {

            // Check whether any of the call arguments equals the node.
            var isParameter = false;
            expr.arguments.forEach( function( a ) {
                if( a === node )
                    isParameter = true;
            } );

            // Return the result.
            return isParameter;

        } else if( expr.type === 'AssignmentExpression' ) {

            // Assignments count the right side as the paramter.
            return expr.right === node;

        } else if( expr.type === 'VariableDeclarator' ) {

            // Declaration count the init expression as the paramter.
            return expr.init === node;

        } else if( expr.type === 'Property' ) {

            // Properties consider the property value as the parameter.
            return expr.value === node;

        } else if( expr.type === 'ArrayExpression' ) {

            // For arrays check whether the node is any of the elements.
            var isElement = false;
            expr.elements.forEach( function( e ) {
                if( e === node )
                    isElement = true;
            } );
            return isElement;

        } else if( expr.type === 'FunctionExpression' ) {

            // Function expression has no 'parameters'.
            // None of the fields end up directly into the HTML (that we know
            // of without solving the halting problem...)
            return false;

        } else if( expr.type === 'ConditionalExpression' ) {

            return node === expr.alternate || node === expr.consequent;

        } else if( expr.type === 'ArrowFunctionExpression' ) {

            return node === expr.body;
        }

        return true;
    },
};

