/* globals define */
(function(root, factory){
    if(typeof define === 'function' && define.amd) {
        define([], function(){
            return (root.utils = factory());
        });
    } else if(typeof module === 'object' && module.exports) {
        module.exports = (root.utils = factory());
    }
}(this, function() {
    const Constants = makeEnum('STDOUT', 'STDERR', 'CLOSE');

    function makeEnum() {
        const names = Array.prototype.slice.call(arguments);
        const obj = {};
        names.forEach((name, i) => obj[name] = i);
        return obj;
    }

    class Message {
        constructor(type, data) {
            this.type = type;
            this.data = data;
        }

        static decode(serialized) {
            const {type, data} = JSON.parse(serialized);
            return new Message(type, data);
        }

        static encode(type, data) {
            //const buffer = Buffer.allocUnsafe(1);
            //buffer.writeUInt8(type, 0);
            //if (!data.isBuffer) {
                //data = Buffer.from(data);
            //}
            //return buffer.concat(data);
            return JSON.stringify({type, data: data.toString()});
        }
    }
    Object.assign(Message, Constants);
    Message.Constants = Constants;

    return Message;
}));
