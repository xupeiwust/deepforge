/*globals define, */

define([
    'deepforge/compute/interactive/session',
    'widgets/TextEditor/TextEditorWidget',
    'css!./styles/TerminalWidget.css'
], function (
    Session,
    TextEditorWidget,
) {
    'use strict';

    const WIDGET_CLASS = 'terminal';
    const CMD_PREFIX = '>> ';

    class TerminalWidget extends TextEditorWidget {
        constructor (logger, container) {
            super(logger, container, {language: 'sh'});
            this.createInteractiveSession();
            this.showWelcome();
            this._el.on('keydown', event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    this.onEnterPressed();
                }
            });
        }

        saveText () {
        }

        async createInteractiveSession () {
            this.session = await Session.new('local');
            //const {stdout} = await this.session.exec('ls /');
            //console.log('---- Received data from session ----');
            //console.log(stdout);
            //console.log('--------');
            //const task = this.session.spawn('ls /');
            //task.on(Session.STDOUT, async data => {
                //console.log('---- Received data from session ----');
                //console.log(data);
                //console.log('--------');
            //});
        }

        async onEnterPressed() {
            // TODO: Should I check for the right value
            const cmd = this.editor.getValue().split('\n').pop().replace(CMD_PREFIX, '');
            await this.runCommand(cmd);
            this.readyForCommand();
        }

        async runCommand (cmd) {
            console.log(`Running "${cmd}"`);
            const {stdout} = await this.session.exec(cmd);
            this.append(stdout);
        }

        readyForCommand () {
            this.append('\n' + CMD_PREFIX);
        }

        showWelcome() {
            this.appendLine('# Welcome to the experimental bash REPL');
        }

        append(text) {
            console.log(`adding "${text}" after ${this.editor.getValue()}`);
            console.log('1. selection', this.editor.session.selection.toJSON());
            text = this.editor.getValue() + text;
            this.editor.setValue(text);
            const lines = text.split('\n');
            const lastRow = lines.length - 1;
            const lastCol = lines[lastRow].length;
            this.editor.selection.fromJSON({
                start: {row: lastRow, column: lastCol},
                end: {row: lastRow, column: lastCol}
            });
            console.log('move cursor to', lastRow, lastCol);
            console.log(`contents is now: "${text}"`);
            console.log('2. selection', this.editor.session.selection.toJSON());
        }

        appendLine(text) {
            return this.append(text + '\n' + CMD_PREFIX);
        }

        addNode() {
        }
    }

    // TODO: Create the interactive compute session

    return TerminalWidget;
});
